/**
 * Vietnamese Text-to-Speech (TTS) normalizer for Catholic Catechism content.
 * Ported from tao_audio2_1d57b143.py and extended with Vietnamese phonetic
 * proper-name transcription (e.g., Giêsu -> Giê-su, Maria -> Ma-ri-a).
 */

const BIBLE_BOOKS: Record<string, string> = {
  // Cựu Ước
  St: 'Sách Sáng Thế',
  Xh: 'Sách Xuất Hành',
  Lv: 'Sách Lê-vi',
  Ds: 'Sách Dân Số',
  Đnl: 'Sách Đệ Nhị Luật',
  Gs: 'Sách Giô-suê',
  Tl: 'Sách Thủ Lãnh',
  R: 'Sách Rút',
  '1 Sm': 'Sách thứ nhất Sa-mu-en',
  '2 Sm': 'Sách thứ hai Sa-mu-en',
  '1 V': 'Sách thứ nhất Các Vua',
  '2 V': 'Sách thứ hai Các Vua',
  '1 Sb': 'Sách thứ nhất Sử Biên Niên',
  '2 Sb': 'Sách thứ hai Sử Biên Niên',
  Er: 'Sách Ét-ra',
  Nkm: 'Sách Nơ-khê-mi-a',
  Tb: 'Sách Tô-bi-a',
  Gđt: 'Sách Giu-đi-tha',
  Et: 'Sách Ét-te',
  '1 Mcb': 'Sách thứ nhất Ma-ca-bê',
  '2 Mcb': 'Sách thứ hai Ma-ca-bê',
  G: 'Sách Gióp',
  Tv: 'Sách Thánh Vịnh',
  Cn: 'Sách Châm Ngôn',
  Gv: 'Sách Giảng Viên',
  Dc: 'Sách Diễm Ca',
  Kn: 'Sách Khôn Ngoan',
  Hc: 'Sách Huấn Ca',
  Is: 'Sách I-sai-a',
  Gr: 'Sách Giê-rê-mi-a',
  Ac: 'Sách Ai Ca',
  Br: 'Sách Ba-rúc',
  Ed: 'Sách Ê-dê-ki-en',
  Đn: 'Sách Đa-ni-en',
  Hs: 'Sách Hô-sê',
  Ge: 'Sách Giô-en',
  Am: 'Sách A-mốt',
  Ob: 'Sách Ô-va-đi-a',
  Gn: 'Sách Giô-na',
  Mk: 'Sách Mi-kha',
  Na: 'Sách Na-khum',
  Kb: 'Sách Kha-ba-cúc',
  Xp: 'Sách Xô-phô-ni-a',
  Kg: 'Sách Khác-gai',
  Dcr: 'Sách Da-ca-ri-a',
  Ml: 'Sách Ma-la-khi',
  // Tân Ước
  Mt: 'Tin Mừng theo thánh Mát-thêu',
  Mc: 'Tin Mừng theo thánh Mác-cô',
  Lc: 'Tin Mừng theo thánh Lu-ca',
  Ga: 'Tin Mừng theo thánh Gio-an',
  Cv: 'Sách Công Vụ Tông Đồ',
  Rm: 'Thư gửi tín hữu Rô-ma',
  '1 Cr': 'Thư thứ nhất gửi tín hữu Cô-rin-tô',
  '2 Cr': 'Thư thứ hai gửi tín hữu Cô-rin-tô',
  Gl: 'Thư gửi tín hữu Ga-lát',
  Ep: 'Thư gửi tín hữu Ê-phê-sô',
  Pl: 'Thư gửi tín hữu Phi-líp-phê',
  Cl: 'Thư gửi tín hữu Cô-lô-xê',
  '1 Tx': 'Thư thứ nhất gửi tín hữu Thê-xa-lô-ni-ca',
  '2 Tx': 'Thư thứ hai gửi tín hữu Thê-xa-lô-ni-ca',
  '1 Tm': 'Thư thứ nhất gửi Ti-mô-thê',
  '2 Tm': 'Thư thứ hai gửi Ti-mô-thê',
  Tt: 'Thư gửi Ti-tô',
  Plm: 'Thư gửi Phi-lê-môn',
  Dt: 'Thư gửi tín hữu Do Thái',
  Gc: 'Thư Gia-cô-bê',
  '1 Pr': 'Thư thứ nhất của thánh Phê-rô',
  '2 Pr': 'Thư thứ hai của thánh Phê-rô',
  '1 Ga': 'Thư thứ nhất của thánh Gio-an',
  '2 Ga': 'Thư thứ hai của thánh Gio-an',
  '3 Ga': 'Thư thứ ba của thánh Gio-an',
  Gđ: 'Thư Giu-đa',
  Kh: 'Sách Khải Huyền',
};

// Roman numeral & common aliases
BIBLE_BOOKS['I Sm'] = BIBLE_BOOKS['1 Sm'];
BIBLE_BOOKS['II Sm'] = BIBLE_BOOKS['2 Sm'];
BIBLE_BOOKS['I V'] = BIBLE_BOOKS['1 V'];
BIBLE_BOOKS['II V'] = BIBLE_BOOKS['2 V'];
BIBLE_BOOKS['I Sb'] = BIBLE_BOOKS['1 Sb'];
BIBLE_BOOKS['II Sb'] = BIBLE_BOOKS['2 Sb'];
BIBLE_BOOKS['I Mcb'] = BIBLE_BOOKS['1 Mcb'];
BIBLE_BOOKS['II Mcb'] = BIBLE_BOOKS['2 Mcb'];
BIBLE_BOOKS['I Cr'] = BIBLE_BOOKS['1 Cr'];
BIBLE_BOOKS['II Cr'] = BIBLE_BOOKS['2 Cr'];
BIBLE_BOOKS['I Tx'] = BIBLE_BOOKS['1 Tx'];
BIBLE_BOOKS['II Tx'] = BIBLE_BOOKS['2 Tx'];
BIBLE_BOOKS['I Tm'] = BIBLE_BOOKS['1 Tm'];
BIBLE_BOOKS['II Tm'] = BIBLE_BOOKS['2 Tm'];
BIBLE_BOOKS['I Pr'] = BIBLE_BOOKS['1 Pr'];
BIBLE_BOOKS['II Pr'] = BIBLE_BOOKS['2 Pr'];
BIBLE_BOOKS['I Ga'] = BIBLE_BOOKS['1 Ga'];
BIBLE_BOOKS['II Ga'] = BIBLE_BOOKS['2 Ga'];
BIBLE_BOOKS['III Ga'] = BIBLE_BOOKS['3 Ga'];
BIBLE_BOOKS['I Jn'] = BIBLE_BOOKS['1 Ga'];
BIBLE_BOOKS['II Jn'] = BIBLE_BOOKS['2 Ga'];
BIBLE_BOOKS['III Jn'] = BIBLE_BOOKS['3 Ga'];

const CATHOLIC_ABBREVIATIONS: Record<string, string> = {
  GLHTCG: 'Sách Giáo lý Hội Thánh Công giáo',
  HĐGMVN: 'Hội đồng Giám mục Việt Nam',
  ĐTC: 'Đức Thánh Cha',
  ĐGM: 'Đức Giám mục',
  LM: 'linh mục',
  PT: 'phó tế',
  GH: 'Hiến chế Giáo hội',
};

/**
 * Vietnamese phonetic hyphenated pronunciation for Catholic/Biblical proper names
 * and theological/liturgical terms so Web Speech TTS reads each syllable cleanly.
 */
const PHONETIC_PROPER_NAMES: Record<string, string> = {
  // Core names requested & found across the 650-question catechism
  'nicea-constantinopoli': 'Ni-xê-a Công-xtan-ti-nô-pô-li',
  constantinopoli: 'Công-xtan-ti-nô-pô-li',
  giêrusalem: 'Giê-ru-sa-lem',
  menkixêđê: 'Men-ki-xê-đê',
  'giê-su': 'Giê-su',
  giêsu: 'Giê-su',
  maria: 'Ma-ri-a',
  kitô: 'Ki-tô',
  giuse: 'Giu-se',
  phêrô: 'Phê-rô',
  phaolô: 'Phao-lô',
  gioan: 'Gio-an',
  giođan: 'Gio-đan',
  mátthêu: 'Mát-thêu',
  máccô: 'Mác-cô',
  luca: 'Lu-ca',
  ápraham: 'Áp-ra-ham',
  abraham: 'Áp-ra-ham',
  aaron: 'A-a-ron',
  israen: 'Ít-ra-en',
  israel: 'Ít-ra-en',
  môsê: 'Mô-sê',
  nôê: 'Nô-ê',
  ađam: 'A-đam',
  evà: 'E-và',
  eva: 'E-và',
  mêsia: 'Mê-si-a',
  lêvi: 'Lê-vi',
  bêlem: 'Bê-lem',
  nadarét: 'Na-da-rét',
  nazarét: 'Na-da-rét',
  galilê: 'Ga-li-lê',
  cana: 'Ca-na',
  sinai: 'Xi-nai',
  rôma: 'Rô-ma',
  philatô: 'Phi-la-tô',
  phongxiô: 'Phong-xi-ô',
  satan: 'Sa-tan',
  nicea: 'Ni-xê-a',
  amen: 'A-men',

  // Additional common Catholic / Biblical names for general reading comfort
  đavít: 'Đa-vít',
  salômon: 'Sa-lô-mon',
  giuđa: 'Giu-đa',
  giuđêa: 'Giu-đê-a',
  samaria: 'Sa-ma-ri-a',
  êlisabét: 'Ê-li-sa-bét',
  dacaria: 'Da-ca-ri-a',
  gabriel: 'Gáp-ri-en',
  micael: 'Mi-ca-en',
  raphaen: 'Ra-pha-en',
  tôma: 'Tô-ma',
  anrê: 'An-rê',
  giacôbê: 'Gia-cô-bê',
  philipphê: 'Phi-líp-phê',
  mácta: 'Mác-ta',
  lazarô: 'La-da-rô',
  magđala: 'Mác-đa-la',
  nicôđêmô: 'Ni-cô-đê-mô',
  hêrôđê: 'Hê-rô-đê',
  caipha: 'Cai-pha',
  baraba: 'Ba-ra-ba',
  phanxicô: 'Phan-xi-cô',
  têrêsa: 'Tê-rê-xa',
  đaminh: 'Đa-minh',
  augustinô: 'Âu-gút-ti-nô',
  alêluia: 'A-lê-lu-i-a',
  halêluia: 'Ha-lê-lu-i-a',
  emmanuel: 'Em-ma-nu-en',
  hôsana: 'Hô-xa-na',
  êmaus: 'Ê-mau',
  calvariô: 'Can-va-ri-ô',
  gôngôtha: 'Gôn-gô-tha',
  pentêcôtê: 'Pen-tê-cốt',
  babilon: 'Ba-bi-lon',
};

const UNITS = [
  'không',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
];

const SCALE_NAMES = [
  '',
  'nghìn',
  'triệu',
  'tỷ',
  'nghìn tỷ',
  'triệu tỷ',
  'tỷ tỷ',
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function readThreeDigits(num: number): string {
  if (num < 0 || num > 999 || !Number.isInteger(num)) {
    return String(num);
  }
  if (num === 0) return 'không';

  const hundred = Math.floor(num / 100);
  const ten = Math.floor((num % 100) / 10);
  const one = num % 10;

  const parts: string[] = [];
  if (hundred > 0) {
    parts.push(UNITS[hundred], 'trăm');
  }

  if (ten > 1) {
    parts.push(UNITS[ten], 'mươi');
    if (one === 1) parts.push('mốt');
    else if (one === 4) parts.push('tư');
    else if (one === 5) parts.push('lăm');
    else if (one > 0) parts.push(UNITS[one]);
  } else if (ten === 1) {
    parts.push('mười');
    if (one === 5) parts.push('lăm');
    else if (one > 0) parts.push(UNITS[one]);
  } else {
    if (hundred > 0 && one > 0) {
      parts.push('lẻ');
    }
    if (one > 0) {
      parts.push(UNITS[one]);
    }
  }

  return parts.join(' ');
}

export function numberToVietnamese(num: number): string {
  if (num === 0) return 'không';
  if (num < 0) return `âm ${numberToVietnamese(-num)}`;

  const groups: number[] = [];
  let n = Math.floor(num);
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  const result: string[] = [];
  const highest = groups.length - 1;

  for (let idx = highest; idx >= 0; idx -= 1) {
    const group = groups[idx];
    if (group === 0) continue;

    if (idx < highest && group < 100) {
      result.push('không trăm');
    }

    result.push(readThreeDigits(group));

    const scale = idx < SCALE_NAMES.length ? SCALE_NAMES[idx] : '';
    if (scale) {
      result.push(scale);
    }
  }

  return result.join(' ').replace(/\s+/g, ' ').trim();
}

export function expandCatholicAbbreviations(text: string): string {
  if (!text) return text;

  const sortedAbbrs = Object.keys(CATHOLIC_ABBREVIATIONS).sort(
    (a, b) => b.length - a.length
  );
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])(${sortedAbbrs.map(escapeRegExp).join('|')})(?=$|[^\\p{L}\\p{N}])`,
    'gu'
  );

  return text.replace(pattern, (_match, prefix: string, abbr: string) => {
    return `${prefix}${CATHOLIC_ABBREVIATIONS[abbr] ?? abbr}`;
  });
}

export function normalizeBibleReference(text: string): string {
  if (!text) return text;

  const booksSorted = Object.keys(BIBLE_BOOKS).sort((a, b) => b.length - a.length);
  const lookup = new Map<string, string>();
  for (const key of booksSorted) {
    lookup.set(key.toLowerCase(), key);
  }

  const bookPattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])(?<book>${booksSorted.map(escapeRegExp).join('|')})\\s+(?<chapter>\\d+)(?:,(?<verseStart>\\d+)(?:-(?<verseEnd>\\d+))?)?(?=$|[^\\p{L}\\p{N}])`,
    'giu'
  );

  let out = text
    .replace(/(^|[^\p{L}\p{N}])(?:xc\.|x\.)\s*/giu, '$1xin xem ')
    .replace(/\(\s*xem\s+/giu, '(xin xem ');

  out = out.replace(bookPattern, (...args) => {
    const groups = args[args.length - 1] as {
      book: string;
      chapter: string;
      verseStart?: string;
      verseEnd?: string;
    };
    const prefix = args[1] as string;
    const rawBook = groups.book;
    const canonicalKey = lookup.get(rawBook.toLowerCase()) ?? rawBook;
    const bookFull = BIBLE_BOOKS[canonicalKey] ?? rawBook;
    const chapterNum = parseInt(groups.chapter, 10);
    const chapterText = numberToVietnamese(chapterNum);

    const base =
      canonicalKey === 'Tv'
        ? `${bookFull}, Thánh Vịnh ${chapterText}`
        : `${bookFull}, chương ${chapterText}`;

    if (!groups.verseStart) {
      return `${prefix}${base}`;
    }

    const vs = numberToVietnamese(parseInt(groups.verseStart, 10));
    if (!groups.verseEnd || groups.verseEnd === groups.verseStart) {
      return `${prefix}${base}, câu ${vs}`;
    }

    const ve = numberToVietnamese(parseInt(groups.verseEnd, 10));
    return `${prefix}${base}, câu ${vs} đến câu ${ve}`;
  });

  return out.replace(/\s+/g, ' ').trim();
}

export function phoneticizeProperNames(text: string): string {
  if (!text) return text;

  const sortedNames = Object.keys(PHONETIC_PROPER_NAMES).sort(
    (a, b) => b.length - a.length
  );
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}-])(${sortedNames.map(escapeRegExp).join('|')})(?=$|[^\\p{L}\\p{N}-])`,
    'giu'
  );

  return text.replace(pattern, (_match, prefix: string, name: string) => {
    const phonetic = PHONETIC_PROPER_NAMES[name.toLowerCase()];
    return `${prefix}${phonetic ?? name}`;
  });
}

/**
 * Complete TTS preprocessing pipeline matching tao_audio2_1d57b143.py:
 * 1. Clean bracketed footnotes & non-breaking spaces
 * 2. Expand Catholic abbreviations
 * 3. Normalize Bible citations & numbers to Vietnamese words
 * 4. Apply Vietnamese hyphenated phonetic transcription to proper names
 */
export function normalizeTextForVietnameseTTS(text: string): string {
  if (!text) return '';

  let normalized = text
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+-\s+/g, ', ');

  normalized = expandCatholicAbbreviations(normalized);
  normalized = normalizeBibleReference(normalized);
  normalized = phoneticizeProperNames(normalized);

  return normalized.replace(/\s+/g, ' ').trim();
}
