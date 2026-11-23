#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tao_audio.py

Chuong trinh doc file Word "GiaoLyFull.docx", tach tung cau hoi/dap
(theo dinh dang "001/ H. ... T. ..."), xac dinh cau hoi do thuoc
Phan (PHAN) nao, Chuong (CHUONG) nao, Bai (BAI) nao, lam sach du lieu,
dung SSML de tao noi dung doc, va goi Edge TTS (edge-tts) de sinh file
mp3 cho tung cau hoi, luu vao dung thu muc phan cap:

    Audio/<Phan>/<Chuong>/<Bai>/<STT>.mp3

Neu mot Bai khong nam trong Chuong nao (khong co tieu de CHUONG dung
truoc no ke tu dau Phan hien tai), file mp3 se duoc luu truc tiep vao:

    Audio/<Phan>/<Bai>/<STT>.mp3

Tac gia: Senior Python Developer (10+ nam kinh nghiem)
Yeu cau Python: 3.11+

Cai dat thu vien truoc khi chay:
    pip install python-docx edge-tts tqdm

Chay:
    python tao_audio.py
"""

from __future__ import annotations

import asyncio
import logging
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

import docx  # python-docx
import edge_tts
from tqdm import tqdm

# =========================================================================
# CAU HINH CHUNG (co the chinh sua o day)
# =========================================================================

# File Word nguon chua toan bo giao ly.
INPUT_DOCX: str = "GiaoLyFull.docx"

# Thu muc goc chua cac file mp3 dau ra (se duoc phan cap theo
# Phan / Chuong / Bai ben trong thu muc nay).
OUTPUT_DIR: str = "Audio"

# File log ghi lai loi trong qua trinh tao audio.
LOG_FILE: str = "audio.log"

# Giong doc mac dinh cua Edge TTS (tieng Viet, nu, Hoai My).
VOICE: str = "vi-VN-NamMinhNeural"

# Neu True: se ghi de len file mp3 da ton tai.
# Neu False: bo qua cau hoi da co file mp3 tuong ung.
OVERWRITE: bool = False

# So luong tac vu (task) toi da chay song song cung mot luc.
MAX_CONCURRENT: int = 5

# Thoi gian nghi (giay) giua phan cau hoi va phan dap an trong SSML.
BREAK_SECONDS: int = 1

# Ten thu muc "Phan" mac dinh, duoc dung khi cac cau hoi dau tien
# xuat hien TRUOC bat ky tieu de "PHAN ..." nao trong file Word
# (tai lieu nguon thuong khong ghi ro nhan "PHAN THU NHAT" cho phan
# dau tien, nen chuong trinh tu dat ten mac dinh nay).
DEFAULT_PART_NAME: str = "PHẦN THỨ NHẤT"

# Ten thu muc "Bai" mac dinh, duoc dung trong truong hop hy huu khi
# mot cau hoi xuat hien nhung chua co tieu de "BAI ..." nao dung truoc.
DEFAULT_LESSON_NAME: str = "Chua_xac_dinh_Bai"

# Do dai toi da (so ky tu) cua moi thanh phan ten thu muc, de tranh
# loi duong dan qua dai tren mot so he dieu hanh.
MAX_FOLDER_NAME_LENGTH: int = 80

# =========================================================================
# THIET LAP LOGGING
# =========================================================================

logging.basicConfig(
    filename=LOG_FILE,
    filemode="a",
    level=logging.INFO,
    format="%(asctime)s - STT:%(message)s",
    encoding="utf-8",
)
logger = logging.getLogger("tao_audio")


# =========================================================================
# CAU TRUC DU LIEU
# =========================================================================

@dataclass
class QuestionItem:
    """Dai dien cho mot cau hoi - dap an duoc trich xuat tu file Word.

    Attributes:
        stt: So thu tu cua cau hoi, dang chuoi 3 chu so, vi du "001".
        question: Noi dung cau hoi (sau "H." va truoc "T."), da trim.
        answer: Noi dung dap an (sau "T." den truoc cau ke tiep), da trim.
        part: Ten thu muc "Phan" ma cau hoi nay thuoc ve.
        chapter: Ten thu muc "Chuong" ma cau hoi nay thuoc ve, hoac
            None neu cau hoi khong nam trong Chuong nao (khi do file
            se duoc luu truc tiep trong thu muc Phan).
        lesson: Ten thu muc "Bai" ma cau hoi nay thuoc ve.
    """

    stt: str
    question: str
    answer: str
    part: str
    chapter: Optional[str]
    lesson: str

    def relative_output_path(self) -> Path:
        """Tra ve duong dan tuong doi (khong ke thu muc goc Audio).

        Cau truc: <Phan>/[<Chuong>/]<Bai>/<STT>.mp3
        Neu chapter la None, bo qua cap thu muc Chuong.

        Returns:
            Doi tuong Path tuong doi, chua ten file "<STT>.mp3" o cuoi.
        """
        parts: List[str] = [self.part]
        if self.chapter:
            parts.append(self.chapter)
        parts.append(self.lesson)
        return Path(*parts) / f"{self.stt}.mp3"


# =========================================================================
# REGEX DUNG CHUNG DE NHAN DIEN CAU TRUC TAI LIEU
# =========================================================================

# Tieu de "PHAN ..." (vi du: "PHAN THU HAI:") - luon o dau dong.
_PART_HEADING_PATTERN = re.compile(r"^PH[ẦA]N\b", re.IGNORECASE)

# Tieu de "CHUONG ..." (vi du: "CHUONG MOT") - luon o dau dong.
_CHAPTER_HEADING_PATTERN = re.compile(r"^CH[ƯU][ƠO]NG\b", re.IGNORECASE)

# Tieu de "BAI <so> ..." (vi du: "BAI 1 - ...") - luon o dau dong.
_LESSON_HEADING_PATTERN = re.compile(r"^B[ÀA]I\s*\d+", re.IGNORECASE)

# Diem bat dau cua mot cau hoi: 3 chu so theo sau boi dau "/".
_QUESTION_START_PATTERN = re.compile(r"^\d{3}/")

# Khoi cau hoi day du trong mot paragraph: STT / H. <question> T. <answer>
# Dau cham sau "H" va "T" duoc coi la tuy chon (\.?) vi mot so cau hoi
# trong tai lieu nguon bi thieu dau cham do loi go van ban.
# QUAN TRONG: marker "T" bat buoc phai nam o DAU MOT DONG MOI (ngay sau
# \n). Neu khong co dieu kien nay, vi chu "T" hoa la ky tu rat pho bien
# trong tieng Viet (vi du chu "Thien", "Toi"...), regex se dung lai qua
# som ngay khi gap chu "T" dau tien trong cau hoi thay vi doi den dung
# dong dap an, lam mat noi dung cau hoi.
# (?=\n*\d{3}/|\Z) dung lai truoc STT ke tiep (neu nhieu cau hoi nam
# chung mot paragraph) hoac o cuoi paragraph.
_QUESTION_BLOCK_PATTERN = re.compile(
    r"(\d{3})/\s*H\.?\s*(.*?)\n\s*T\.?\s*(.*?)(?=\n*\d{3}/|\Z)",
    re.DOTALL,
)


# =========================================================================
# HAM: load_document
# =========================================================================

def load_document(file_path: str) -> List[str]:
    """Doc toan bo file Word va tra ve danh sach noi dung tung paragraph.

    Giu nguyen thu tu cac paragraph trong file Word (khong noi thanh
    mot chuoi duy nhat) de cac buoc xu ly sau co the vua tach cau hoi,
    vua theo doi dung Phan / Chuong / Bai hien tai dua tren vi tri xuat
    hien cua cac tieu de trong tai lieu.

    Args:
        file_path: Duong dan toi file .docx can doc.

    Returns:
        Danh sach chuoi, moi phan tu la noi dung tho (chua qua xu ly)
        cua mot paragraph trong file Word, theo dung thu tu xuat hien.

    Raises:
        FileNotFoundError: Neu file khong ton tai.
        Exception: Neu co loi khac khi doc file Word.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Khong tim thay file Word: {file_path}")

    try:
        document = docx.Document(str(path))
    except Exception as exc:  # noqa: BLE001
        logger.error("N/A - Loi khi mo file Word: %s", exc)
        raise

    paragraphs: List[str] = [p.text for p in document.paragraphs]
    return paragraphs


# =========================================================================
# HAM: clean_text
# =========================================================================

def clean_text(text: str) -> str:
    """Lam sach mot doan van ban.

    Cac buoc lam sach:
        1. Loai bo moi noi dung nam trong dau ngoac vuong [], vi du:
           [1], [12], [GLHTCG 123], [x. Ga 1,29].
        2. Loai bo ky tu khoang trang khong ngat (non-breaking space).
        3. Loai bo khoang trang du thua o dau/cuoi dong va giua cac tu.
        4. Loai bo nhieu dong trong lien tiep, chi giu lai mot dong trong.

    Args:
        text: Chuoi van ban dau vao can lam sach.

    Returns:
        Chuoi van ban da duoc lam sach.
    """
    if not text:
        return ""

    # 1. Loai bo moi noi dung trong dau ngoac vuong [...]
    cleaned = re.sub(r"\[[^\]]*\]", "", text)

    # 2. Thay the non-breaking space (\xa0) bang khoang trang thuong.
    cleaned = cleaned.replace("\xa0", " ")

    # 3. Loai bo khoang trang du thua tren tung dong.
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in cleaned.splitlines()]

    # 4. Loai bo cac dong trong du thua, chi giu lai cac dong co noi dung.
    non_empty_lines = [line for line in lines if line]

    cleaned = "\n".join(non_empty_lines)
    cleaned = cleaned.strip()
    return cleaned


# =========================================================================
# BIBLE CITATION PARSER + NORMALIZE FOR TTS
# =========================================================================

# Danh sách 73 sách Kinh Thánh + alias thường gặp.
BIBLE_BOOKS = {
    # Cựu Ước
    "St": "Sách Sáng Thế",
    "Xh": "Sách Xuất Hành",
    "Lv": "Sách Lê-vi",
    "Ds": "Sách Dân Số",
    "Đnl": "Sách Đệ Nhị Luật",
    "Gs": "Sách Giô-suê",
    "Tl": "Sách Thủ Lãnh",
    "R": "Sách Rút",
    "1 Sm": "Sách thứ nhất Sa-mu-en",
    "2 Sm": "Sách thứ hai Sa-mu-en",
    "1 V": "Sách thứ nhất Các Vua",
    "2 V": "Sách thứ hai Các Vua",
    "1 Sb": "Sách thứ nhất Sử Biên Niên",
    "2 Sb": "Sách thứ hai Sử Biên Niên",
    "Er": "Sách Ét-ra",
    "Nkm": "Sách Nơ-khê-mi-a",
    "Tb": "Sách Tô-bi-a",
    "Gđt": "Sách Giu-đi-tha",
    "Et": "Sách Ét-te",
    "1 Mcb": "Sách thứ nhất Ma-ca-bê",
    "2 Mcb": "Sách thứ hai Ma-ca-bê",
    "G": "Sách Gióp",
    "Tv": "Sách Thánh Vịnh",
    "Cn": "Sách Châm Ngôn",
    "Gv": "Sách Giảng Viên",
    "Dc": "Sách Diễm Ca",
    "Kn": "Sách Khôn Ngoan",
    "Hc": "Sách Huấn Ca",
    "Is": "Sách I-sai-a",
    "Gr": "Sách Giê-rê-mi-a",
    "Ac": "Sách Ai Ca",
    "Br": "Sách Ba-rúc",
    "Ed": "Sách Ê-dê-ki-en",
    "Đn": "Sách Đa-ni-en",
    "Hs": "Sách Hô-sê",
    "Ge": "Sách Giô-en",
    "Am": "Sách A-mốt",
    "Ob": "Sách Ô-va-đi-a",
    "Gn": "Sách Giô-na",
    "Mk": "Sách Mi-kha",
    "Na": "Sách Na-khum",
    "Kb": "Sách Kha-ba-cúc",
    "Xp": "Sách Xô-phô-ni-a",
    "Kg": "Sách Khác-gai",
    "Dcr": "Sách Da-ca-ri-a",
    "Ml": "Sách Ma-la-khi",
    # Tân Ước
    "Mt": "Tin Mừng theo thánh Mát-thêu",
    "Mc": "Tin Mừng theo thánh Mác-cô",
    "Lc": "Tin Mừng theo thánh Lu-ca",
    "Ga": "Tin Mừng theo thánh Gio-an",
    "Cv": "Sách Công Vụ Tông Đồ",
    "Rm": "Thư gửi tín hữu Rô-ma",
    "1 Cr": "Thư thứ nhất gửi tín hữu Cô-rin-tô",
    "2 Cr": "Thư thứ hai gửi tín hữu Cô-rin-tô",
    "Gl": "Thư gửi tín hữu Ga-lát",
    "Ep": "Thư gửi tín hữu Ê-phê-sô",
    "Pl": "Thư gửi tín hữu Phi-líp-phê",
    "Cl": "Thư gửi tín hữu Cô-lô-xê",
    "1 Tx": "Thư thứ nhất gửi tín hữu Thê-xa-lô-ni-ca",
    "2 Tx": "Thư thứ hai gửi tín hữu Thê-xa-lô-ni-ca",
    "1 Tm": "Thư thứ nhất gửi Ti-mô-thê",
    "2 Tm": "Thư thứ hai gửi Ti-mô-thê",
    "Tt": "Thư gửi Ti-tô",
    "Plm": "Thư gửi Phi-lê-môn",
    "Dt": "Thư gửi tín hữu Do Thái",
    "Gc": "Thư Gia-cô-bê",
    "1 Pr": "Thư thứ nhất của thánh Phê-rô",
    "2 Pr": "Thư thứ hai của thánh Phê-rô",
    "1 Ga": "Thư thứ nhất của thánh Gio-an",
    "2 Ga": "Thư thứ hai của thánh Gio-an",
    "3 Ga": "Thư thứ ba của thánh Gio-an",
    "Gđ": "Thư Giu-đa",
    "Kh": "Sách Khải Huyền",
}

# Alias dạng số La Mã / biến thể thường gặp.
BIBLE_BOOKS.update(
    {
        "I Sm": BIBLE_BOOKS["1 Sm"],
        "II Sm": BIBLE_BOOKS["2 Sm"],
        "I V": BIBLE_BOOKS["1 V"],
        "II V": BIBLE_BOOKS["2 V"],
        "I Sb": BIBLE_BOOKS["1 Sb"],
        "II Sb": BIBLE_BOOKS["2 Sb"],
        "I Mcb": BIBLE_BOOKS["1 Mcb"],
        "II Mcb": BIBLE_BOOKS["2 Mcb"],
        "I Cr": BIBLE_BOOKS["1 Cr"],
        "II Cr": BIBLE_BOOKS["2 Cr"],
        "I Tx": BIBLE_BOOKS["1 Tx"],
        "II Tx": BIBLE_BOOKS["2 Tx"],
        "I Tm": BIBLE_BOOKS["1 Tm"],
        "II Tm": BIBLE_BOOKS["2 Tm"],
        "I Pr": BIBLE_BOOKS["1 Pr"],
        "II Pr": BIBLE_BOOKS["2 Pr"],
        "I Ga": BIBLE_BOOKS["1 Ga"],
        "II Ga": BIBLE_BOOKS["2 Ga"],
        "III Ga": BIBLE_BOOKS["3 Ga"],
        "I Jn": BIBLE_BOOKS["1 Ga"],
        "II Jn": BIBLE_BOOKS["2 Ga"],
        "III Jn": BIBLE_BOOKS["3 Ga"],
    }
)

CATOLIC_ABBREVIATIONS = {
    "GLHTCG": "Sách Giáo lý Hội Thánh Công giáo",
    "HĐGMVN": "Hội đồng Giám mục Việt Nam",
    "ĐTC": "Đức Thánh Cha",
    "ĐGM": "Đức Giám mục",
    "LM": "linh mục",
    "PT": "phó tế",
}

_UNITS = [
    "không",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
]

_SCALE_NAMES = [
    "",
    "nghìn",
    "triệu",
    "tỷ",
    "nghìn tỷ",
    "triệu tỷ",
    "tỷ tỷ",
]


def read_three_digits(num: int) -> str:
    """Đọc một nhóm 3 chữ số theo tiếng Việt."""
    if not 0 <= num <= 999:
        raise ValueError("read_three_digits chỉ nhận số từ 0 đến 999")
    if num == 0:
        return "không"

    hundred = num // 100
    ten = (num % 100) // 10
    one = num % 10

    parts = []
    if hundred > 0:
        parts.append(_UNITS[hundred])
        parts.append("trăm")

    if ten > 1:
        parts.append(_UNITS[ten])
        parts.append("mươi")
        if one == 1:
            parts.append("mốt")
        elif one == 4:
            parts.append("tư")
        elif one == 5:
            parts.append("lăm")
        elif one > 0:
            parts.append(_UNITS[one])
    elif ten == 1:
        parts.append("mười")
        if one == 5:
            parts.append("lăm")
        elif one > 0:
            parts.append(_UNITS[one])
    else:
        if hundred > 0 and one > 0:
            parts.append("lẻ")
        if one > 0:
            parts.append(_UNITS[one])

    return " ".join(parts)


def number_to_vietnamese(number: int) -> str:
    """Đọc số nguyên tiếng Việt đầy đủ."""
    if number == 0:
        return "không"
    if number < 0:
        return "âm " + number_to_vietnamese(-number)

    groups = []
    n = number
    while n > 0:
        groups.append(n % 1000)
        n //= 1000

    result = []
    highest = len(groups) - 1

    for idx in range(highest, -1, -1):
        group = groups[idx]
        if group == 0:
            continue

        if idx < highest and group < 100:
            result.append("không trăm")

        result.append(read_three_digits(group))

        scale = _SCALE_NAMES[idx] if idx < len(_SCALE_NAMES) else ""
        if scale:
            result.append(scale)

    return " ".join(result).replace("  ", " ").strip()


def expand_catholic_abbreviations(text: str) -> str:
    """Mở rộng một số viết tắt Công giáo trước khi TTS đọc."""
    if not text:
        return text

    out = text
    for abbr, full in sorted(
        CATOLIC_ABBREVIATIONS.items(), key=lambda kv: len(kv[0]), reverse=True
    ):
        out = re.sub(rf"\b{re.escape(abbr)}\b", full, out)
    return out


def _normalize_spacing(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_bible_reference(text: str) -> str:
    """Chuyển trích dẫn Kinh Thánh sang dạng đọc tự nhiên cho TTS."""
    if not text:
        return text

    books_sorted = sorted(BIBLE_BOOKS.keys(), key=len, reverse=True)
    pattern = re.compile(
        r"\b(?P<book>" + "|".join(re.escape(b) for b in books_sorted) + r")"
        r"\s+"
        r"(?P<chapter>\d+)"
        r"(?:,(?P<verse_start>\d+)(?:-(?P<verse_end>\d+))?)?",
        flags=re.IGNORECASE,
    )

    lookup = {k.lower(): k for k in BIBLE_BOOKS.keys()}

    def repl(match: re.Match[str]) -> str:
        raw_book = match.group("book")
        key = lookup.get(raw_book.lower(), raw_book)
        book_full = BIBLE_BOOKS.get(key, raw_book)
        chapter = int(match.group("chapter"))
        verse_start = match.group("verse_start")
        verse_end = match.group("verse_end")

        chapter_text = number_to_vietnamese(chapter)

        if key == "Tv":
            base = f"{book_full}, Thánh Vịnh {chapter_text}"
        else:
            base = f"{book_full}, chương {chapter_text}"

        if verse_start is None:
            return base

        vs = number_to_vietnamese(int(verse_start))
        if verse_end is None or verse_end == verse_start:
            return f"{base}, câu {vs}"

        ve = number_to_vietnamese(int(verse_end))
        return f"{base}, câu {vs} đến câu {ve}"

    out = text
    out = re.sub(r"\bxc\.\s*", "xin xem ", out, flags=re.IGNORECASE)
    out = re.sub(r"\bx\.\s*", "xin xem ", out, flags=re.IGNORECASE)
    out = re.sub(r"\bxem\s*", "xin xem ", out, flags=re.IGNORECASE)

    out = pattern.sub(repl, out)
    out = _normalize_spacing(out)
    return out


def normalize_for_tts_full(text: str) -> str:
    """Pipeline hoàn chỉnh trước khi tạo SSML."""
    if not text:
        return text
    text = text.replace("\xa0", " ")
    text = expand_catholic_abbreviations(text)
    text = normalize_bible_reference(text)
    text = _normalize_spacing(text)
    return text


# =========================================================================
# HAM PHU TRO: sanitize_folder_name
# =========================================================================

def sanitize_folder_name(name: str) -> str:
    """Chuyen mot chuoi tieu de thanh ten thu muc hop le, an toan.

    Thuc hien:
        - Loai bo cac ky tu khong duoc phep trong ten thu muc tren
          Windows/Unix: \\ / : * ? " < > |
        - Thay the khoang trang thua boi mot khoang trang don.
        - Cat bot ten qua dai (gioi han boi MAX_FOLDER_NAME_LENGTH) de
          tranh loi duong dan qua dai tren mot so he dieu hanh.
        - Loai bo dau cham/khoang trang o cuoi ten (Windows khong cho
          phep thu muc ket thuc bang dau cham hoac khoang trang).

    Args:
        name: Chuoi tieu de goc (co the chua nhieu dong, ky tu dac biet).

    Returns:
        Chuoi ten thu muc da duoc lam sach, an toan de tao thu muc.
    """
    # Thay dau xuong dong bang " - " truoc khi lam sach cac ky tu khac.
    flattened = name.replace("\n", " - ")
    flattened = clean_text(flattened)

    # Loai bo cac ky tu khong hop le trong ten thu muc.
    safe_name = re.sub(r'[\\/:*?"<>|]', "", flattened)

    # Gop nhieu khoang trang thanh mot khoang trang.
    safe_name = re.sub(r"\s+", " ", safe_name).strip()

    # Cat bot neu qua dai.
    if len(safe_name) > MAX_FOLDER_NAME_LENGTH:
        safe_name = safe_name[:MAX_FOLDER_NAME_LENGTH].rstrip()

    # Loai bo dau cham/khoang trang o cuoi (khong hop le tren Windows).
    safe_name = safe_name.rstrip(" .")

    return safe_name if safe_name else "Khong_co_tieu_de"


# =========================================================================
# HAM PHU TRO: classify_paragraph
# =========================================================================

def classify_paragraph(text: str) -> str:
    """Xac dinh loai cua mot paragraph da duoc trim khoang trang.

    Args:
        text: Noi dung paragraph da duoc .strip().

    Returns:
        Mot trong cac gia tri: "part", "chapter", "lesson", "question",
        hoac "other" neu khong thuoc loai tieu de/cau hoi nao.
    """
    first_line = text.split("\n", 1)[0].strip()
    if _PART_HEADING_PATTERN.match(first_line):
        return "part"
    if _CHAPTER_HEADING_PATTERN.match(first_line):
        return "chapter"
    if _LESSON_HEADING_PATTERN.match(first_line):
        return "lesson"
    if _QUESTION_START_PATTERN.match(first_line):
        return "question"
    return "other"


# Cac ky tu mo dau thuong gap cua mot cau trich Kinh Thanh (dau ngoac
# kep dac biet). Neu paragraph ke tiep bat dau bang cac ky tu nay, no
# gan nhu chac chan la mot cau trich dan Kinh Thanh chu KHONG PHAI la
# phan tieu de bo sung, nen se khong duoc gop vao ten thu muc.
_QUOTE_START_CHARS: Tuple[str, ...] = ('"', "“", "„", "'", "‘")

# Anh xa loai tieu de ("part"/"chapter"/"lesson") sang regex tuong ung,
# dung de xac dinh phan con lai cua dong dau sau khi bo tien to tieu de.
_HEADING_PATTERN_BY_KIND = {
    "part": _PART_HEADING_PATTERN,
    "chapter": _CHAPTER_HEADING_PATTERN,
    "lesson": _LESSON_HEADING_PATTERN,
}


# =========================================================================
# HAM PHU TRO: extract_heading_title
# =========================================================================

def extract_heading_title(
    paragraphs: List[str], index: int, kind: str
) -> Tuple[str, int]:
    """Trich xuat tieu de day du cho mot Phan/Chuong/Bai tai vi tri index.

    Mot so tieu de trong tai lieu Word chi co dong dau "troc" (vi du
    "PHAN THU HAI:" hoac "BAI 63" ma khong co ten bai di kem) con phan
    mo ta chi tiet nam o PARAGRAPH KE TIEP (tach rieng). Ham nay chi
    gop paragraph ke tiep vao tieu de khi dong dau THUC SU "troc"
    (khong co noi dung mo ta nao sau tu khoa/so thu tu), va paragraph
    ke tiep khong phai la mot cau trich dan Kinh Thanh (thuong bat dau
    bang dau ngoac kep). Neu dong dau da co san ten day du (vi du
    "BAI 1 - THIEN CHUA CHO CHUNG TA NHAN BIET NGAI"), giu nguyen,
    khong gop them cau trich dan phia sau vao ten thu muc.

    Args:
        paragraphs: Danh sach toan bo paragraph cua tai lieu.
        index: Vi tri (chi so) cua paragraph chua tieu de can trich xuat.
        kind: Loai tieu de, mot trong "part", "chapter", "lesson".

    Returns:
        Tuple gom (tieu_de_day_du_da_sanitize, chi_so_paragraph_cuoi_cung
        da_duoc_tieu_thu). Chi so nay dung de vong lap ben ngoai biet
        can nhay toi dau tiep theo (tranh xu ly trung lap paragraph da
        duoc gop lam tieu de).
    """
    text = paragraphs[index].strip()
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    consumed_index = index
    next_index = index + 1

    # Xac dinh xem dong dau tien co con noi dung mo ta nao sau tu khoa/
    # so thu tu hay khong (vi du "BAI 63" -> khong con gi; "BAI 1 - ABC"
    # -> con "- ABC"). Neu con noi dung, tieu de coi nhu da day du.
    first_line = lines[0] if lines else ""
    pattern = _HEADING_PATTERN_BY_KIND.get(kind)
    remainder = ""
    if pattern is not None:
        match = pattern.match(first_line)
        if match:
            remainder = first_line[match.end():].strip(" -–:.\u2013\u2014")

    is_bare_heading = (len(lines) < 2) and (not remainder)

    if is_bare_heading and next_index < len(paragraphs):
        next_text = paragraphs[next_index].strip()
        looks_like_quote = next_text.startswith(_QUOTE_START_CHARS)
        if (
            next_text
            and not looks_like_quote
            and classify_paragraph(next_text) == "other"
        ):
            lines.append(next_text)
            consumed_index = next_index

    title = sanitize_folder_name(" - ".join(lines))
    return title, consumed_index


# =========================================================================
# HAM: split_questions
# =========================================================================

def split_questions(paragraphs: List[str]) -> List[QuestionItem]:
    """Tach danh sach paragraph thanh danh sach cac cau hoi - dap an.

    Duyet tuan tu qua tung paragraph, theo doi trang thai Phan/Chuong/Bai
    hien tai dua tren cac tieu de "PHAN", "CHUONG", "BAI" gap phai. Khi
    gap mot paragraph bat dau bang mau STT (vi du "001/"), tach ra tat
    ca cac khoi cau hoi trong paragraph do (mot paragraph co the chua
    nhieu hon mot cau hoi) va gan cho moi cau hoi thong tin Phan/Chuong/
    Bai hien tai.

    Quy tac gan thu muc:
        - Khi gap tieu de "PHAN": cap nhat Phan hien tai, dat lai
          Chuong hien tai ve None (vi Chuong danh so lai tu dau o moi
          Phan) va Bai hien tai ve None.
        - Khi gap tieu de "CHUONG": cap nhat Chuong hien tai, dat lai
          Bai hien tai ve None.
        - Khi gap tieu de "BAI": cap nhat Bai hien tai (Chuong hien tai
          GIU NGUYEN, vi mot Chuong co the co nhieu Bai).
        - Neu mot cau hoi xuat hien khi Chuong hien tai la None (nghia
          la Bai do khong nam trong Chuong nao ke tu dau Phan), cau hoi
          se duoc gan chapter=None, va sau nay se duoc luu truc tiep
          trong thu muc Phan (khong co cap thu muc Chuong).

    Args:
        paragraphs: Danh sach paragraph tra ve tu load_document().

    Returns:
        Danh sach cac doi tuong QuestionItem da duoc trich xuat, lam
        sach va gan day du thong tin Phan/Chuong/Bai.
    """
    items: List[QuestionItem] = []

    current_part: str = DEFAULT_PART_NAME
    current_chapter: Optional[str] = None
    current_lesson: str = DEFAULT_LESSON_NAME

    total = len(paragraphs)
    index = 0
    while index < total:
        raw_text = paragraphs[index]
        text = raw_text.strip()

        if not text:
            index += 1
            continue

        kind = classify_paragraph(text)

        if kind == "part":
            title, consumed_index = extract_heading_title(paragraphs, index, kind)
            current_part = title
            current_chapter = None
            current_lesson = DEFAULT_LESSON_NAME
            index = consumed_index

        elif kind == "chapter":
            title, consumed_index = extract_heading_title(paragraphs, index, kind)
            current_chapter = title
            current_lesson = DEFAULT_LESSON_NAME
            index = consumed_index

        elif kind == "lesson":
            title, consumed_index = extract_heading_title(paragraphs, index, kind)
            current_lesson = title
            index = consumed_index

        elif kind == "question":
            for match in _QUESTION_BLOCK_PATTERN.finditer(text):
                stt_raw, question_raw, answer_raw = match.groups()

                stt = stt_raw.strip().zfill(3)
                question = clean_text(question_raw)
                answer = clean_text(answer_raw)

                if not question or not answer:
                    logger.info(
                        "%s - Bo qua vi thieu question hoac answer.", stt
                    )
                    continue

                items.append(
                    QuestionItem(
                        stt=stt,
                        question=question,
                        answer=answer,
                        part=current_part,
                        chapter=current_chapter,
                        lesson=current_lesson,
                    )
                )

        # kind == "other": paragraph thong thuong (loi trich dan, mo ta),
        # khong lam thay doi trang thai Phan/Chuong/Bai hien tai.

        index += 1

    return items


# =========================================================================
# HAM: build_ssml
# =========================================================================

def build_ssml(item: QuestionItem) -> str:
    """Xay dung noi dung SSML de doc cho mot cau hoi.

    Mau doc:
        Cau <STT>.
        <question>
        (nghi 5 giay)
        Dap an.
        <answer>

    Args:
        item: Doi tuong QuestionItem chua STT, question va answer.

    Returns:
        Chuoi SSML hoan chinh, duoc bao trong the <speak>.
    """
    # Chuẩn hóa văn bản trước khi escape XML.
    question_text = normalize_for_tts_full(item.question)
    answer_text = normalize_for_tts_full(item.answer)

    # Escape cac ky tu dac biet XML de tranh loi khi tao SSML.
    def escape_xml(value: str) -> str:
        value = value.replace("&", "&amp;")
        value = value.replace("<", "&lt;")
        value = value.replace(">", "&gt;")
        value = value.replace('"', "&quot;")
        value = value.replace("'", "&apos;")
        return value

    question_escaped = escape_xml(question_text)
    answer_escaped = escape_xml(answer_text)

    ssml = (
        f"Câu {item.stt}. {question_escaped} "
        f"Thưa. {answer_escaped}"
    )
    return ssml


# =========================================================================
# HAM: generate_audio
# =========================================================================

async def generate_audio(item: QuestionItem, output_dir: Path) -> Tuple[str, bool, Optional[str]]:
    """Sinh file mp3 cho mot cau hoi bang Edge TTS.

    File duoc luu vao dung cap thu muc Phan/Chuong/Bai tuong ung (xem
    QuestionItem.relative_output_path()). Thu muc se duoc tao tu dong
    neu chua ton tai. Neu file mp3 da ton tai va OVERWRITE=False thi
    bo qua khong tao lai.

    Args:
        item: Doi tuong QuestionItem can tao audio.
        output_dir: Thu muc goc (Audio) chua cac file mp3.

    Returns:
        Tuple gom (stt, thanh_cong, thong_bao_loi_neu_co).
    """
    output_path = output_dir / item.relative_output_path()

    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
    except Exception as exc:  # noqa: BLE001
        error_message = f"Khong the tao thu muc {output_path.parent}: {exc}"
        logger.error("%s - %s", item.stt, error_message)
        return item.stt, False, error_message

    if output_path.exists() and not OVERWRITE:
        logger.info("%s - Bo qua vi file da ton tai: %s", item.stt, output_path)
        return item.stt, True, None

    try:
        ssml = build_ssml(item)
        communicator = edge_tts.Communicate(text=ssml, voice=VOICE)
        await communicator.save(str(output_path))
        return item.stt, True, None
    except Exception as exc:  # noqa: BLE001
        error_message = str(exc)
        logger.error("%s - Loi khi tao audio: %s", item.stt, error_message)
        return item.stt, False, error_message


# =========================================================================
# HAM: worker
# =========================================================================

async def worker(
    item: QuestionItem,
    output_dir: Path,
    semaphore: asyncio.Semaphore,
    progress_bar: tqdm,
) -> Tuple[str, bool, Optional[str]]:
    """Worker bao boc generate_audio(), gioi han so luong tac vu song song.

    Su dung asyncio.Semaphore de dam bao khong co qua MAX_CONCURRENT
    tac vu chay dong thoi, tranh bi chan boi dich vu Edge TTS.

    Args:
        item: Doi tuong QuestionItem can xu ly.
        output_dir: Thu muc goc (Audio) chua cac file mp3.
        semaphore: Semaphore dung de gioi han so luong tac vu song song.
        progress_bar: Thanh tien trinh tqdm de cap nhat sau moi cau.

    Returns:
        Tuple gom (stt, thanh_cong, thong_bao_loi_neu_co).
    """
    async with semaphore:
        try:
            result = await generate_audio(item, output_dir)
        except Exception as exc:  # noqa: BLE001
            # Bat toan bo loi khong luong truoc de khong lam dung ca
            # chuong trinh, tiep tuc voi cau hoi ke tiep.
            logger.error("%s - Loi khong xac dinh trong worker: %s", item.stt, exc)
            result = (item.stt, False, str(exc))
        finally:
            progress_bar.update(1)
    return result


# =========================================================================
# HAM: main
# =========================================================================

async def _run(items: List[QuestionItem], output_dir: Path) -> Tuple[int, int]:
    """Chay toan bo cac worker theo asyncio.Task va tra ve so lieu tong ket.

    Args:
        items: Danh sach cau hoi can tao audio.
        output_dir: Thu muc goc (Audio) chua cac file mp3.

    Returns:
        Tuple gom (so_luong_thanh_cong, so_luong_that_bai).
    """
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    success_count = 0
    failed_count = 0

    with tqdm(total=len(items), desc="Creating audio") as progress_bar:
        tasks = [
            asyncio.create_task(worker(item, output_dir, semaphore, progress_bar))
            for item in items
        ]

        results = await asyncio.gather(*tasks, return_exceptions=False)

    for stt, success, error_message in results:
        if success:
            success_count += 1
        else:
            failed_count += 1
            logger.error("%s - That bai cuoi cung: %s", stt, error_message)

    return success_count, failed_count


def main() -> None:
    """Ham chinh: doc file Word, tach cau hoi, tao audio va in bao cao.

    Cac buoc thuc hien:
        1. Doc file Word (load_document).
        2. Tach danh sach cau hoi va xac dinh Phan/Chuong/Bai tuong ung
           cho tung cau hoi (split_questions).
        3. Tao thu muc goc "Audio" neu chua ton tai (cac thu muc con
           theo Phan/Chuong/Bai se duoc tao tu dong khi sinh audio).
        4. Chay bat dong bo (asyncio) de tao audio cho tung cau hoi,
           gioi han so luong tac vu song song boi MAX_CONCURRENT.
        5. In bao cao tong ket sau khi hoan tat.
    """
    start_time = time.time()

    print(f"Dang doc file Word: {INPUT_DOCX} ...")
    try:
        paragraphs = load_document(INPUT_DOCX)
    except Exception as exc:  # noqa: BLE001
        print(f"LOI: Khong the doc file Word - {exc}")
        logger.error("N/A - Khong the doc file Word: %s", exc)
        return

    print("Dang tach cau hoi va xac dinh Phan / Chuong / Bai ...")
    items = split_questions(paragraphs)
    total_questions = len(items)
    print(f"Tong so cau hoi tim thay: {total_questions}")

    if total_questions == 0:
        print("Khong tim thay cau hoi nao. Ket thuc chuong trinh.")
        return

    # Thong ke so luong thu muc Phan/Chuong/Bai duy nhat de nguoi dung
    # nam duoc cau truc truoc khi bat dau sinh audio.
    unique_folders = {str(item.relative_output_path().parent) for item in items}
    print(f"Tong so thu muc (Phan/Chuong/Bai) se duoc tao: {len(unique_folders)}")

    output_dir = Path(OUTPUT_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)

    success_count, failed_count = asyncio.run(_run(items, output_dir))

    elapsed_time = time.time() - start_time

    print("---------------------------------")
    print(f"Total questions: {total_questions}")
    print(f"Success: {success_count}")
    print(f"Failed: {failed_count}")
    print(f"Elapsed time: {elapsed_time:.2f} giay")
    print("---------------------------------")


if __name__ == "__main__":
    main()
