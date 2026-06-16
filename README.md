# 📚 Cùng Học Giáo Lý (CungHocGiaoLy)

Ứng dụng web hỗ trợ **học tập, tra cứu và hệ thống hóa kiến thức Giáo lý Công giáo** theo hướng trực quan, khoa học và dễ tiếp cận trên nhiều thiết bị.

<p align="center">
  <a href="https://cunghocgiaoly-521022870619.asia-southeast1.run.app" target="_blank">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-Truy_cập_ngay-blue?style=for-the-badge" alt="Live Demo">
  </a>
</p>

![Giao diện ứng dụng](path/to/screenshot.png)

---

## 🎯 Giới thiệu

**Cùng Học Giáo Lý** được xây dựng nhằm hỗ trợ người học tiếp cận và ôn tập kiến thức Giáo lý một cách có hệ thống. Ứng dụng tập trung vào trải nghiệm đọc, tra cứu nhanh và điều hướng nội dung hiệu quả, giúp người dùng dễ dàng theo dõi quá trình học tập của mình.

**Live Demo:**
👉 https://cunghocgiaoly-521022870619.asia-southeast1.run.app

---

## ✨ Các tính năng cốt lõi

### 📖 Hệ thống bài học & tài liệu

* Tổ chức nội dung theo danh mục, phần và chương rõ ràng.
* Hỗ trợ tra cứu nhanh các chủ đề Giáo lý.
* Cấu trúc nội dung trực quan, dễ mở rộng.

### 🧭 Trình xem nội dung tương tác

* Giao diện tập trung vào nội dung học tập.
* Điều hướng giữa các bài học nhanh chóng.
* Hạn chế yếu tố gây phân tán khi đọc.

### 📱 Responsive Design

* Tối ưu hiển thị trên:

  * Điện thoại di động
  * Máy tính bảng
  * Máy tính để bàn
* Trải nghiệm nhất quán trên nhiều kích thước màn hình.

### ⚡ Hiệu năng tối ưu

* Tải trang nhanh với cơ chế render hiện đại của Next.js.
* Điều hướng mượt mà giữa các nội dung.
* Tối ưu tài nguyên tĩnh và hiệu suất giao diện.

---

## 🛠️ Công nghệ & Kiến trúc

| Thành phần       | Công nghệ                                     |
| ---------------- | --------------------------------------------- |
| Frontend         | Next.js                                       |
| UI Library       | React                                         |
| Ngôn ngữ         | TypeScript                                    |
| Styling          | Tailwind CSS                                  |
| Routing          | App Router (Next.js)                          |
| Data Fetching    | Server Components / Client Components         |
| State Management | React Context / Zustand (tuỳ nhu cầu mở rộng) |
| Deployment       | Docker                                        |
| Cloud Platform   | Google Cloud Run                              |

---

## 🚀 Hướng dẫn cài đặt & chạy local

### Yêu cầu hệ thống

* Node.js >= 18
* npm / yarn / pnpm

### 1. Clone mã nguồn

```bash
git clone https://github.com/your-username/cunghocgiaoly.git

cd cunghocgiaoly
```

### 2. Cài đặt thư viện

```bash
npm install
```

Hoặc:

```bash
yarn install
```

Hoặc:

```bash
pnpm install
```

### 3. Khởi chạy môi trường phát triển

```bash
npm run dev
```

Mặc định ứng dụng sẽ chạy tại:

```text
http://localhost:3000
```

### 4. Build production

```bash
npm run build
```

### 5. Chạy bản production

```bash
npm run start
```

---

## 📁 Cấu trúc thư mục

```text
cunghocgiaoly/
│
├── app/                    # App Router (Next.js)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── lessons/
│   ├── categories/
│   └── search/
│
├── components/             # UI Components dùng chung
│   ├── layout/
│   ├── navigation/
│   ├── cards/
│   └── forms/
│
├── lib/                    # Utility functions
│
├── hooks/                  # Custom React Hooks
│
├── services/               # API & data services
│
├── public/                 # Static assets
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── styles/
│   └── globals.css
│
├── types/                  # TypeScript types
│
├── docker/
│
├── Dockerfile
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🧪 Scripts

| Lệnh            | Mô tả                        |
| --------------- | ---------------------------- |
| `npm run dev`   | Chạy môi trường phát triển   |
| `npm run build` | Build production             |
| `npm run start` | Chạy production build        |
| `npm run lint`  | Kiểm tra chất lượng mã nguồn |

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón.

### Quy trình đề xuất

1. Fork repository.
2. Tạo branch mới.

```bash
git checkout -b feature/ten-tinh-nang
```

3. Commit thay đổi.

```bash
git commit -m "feat: thêm tính năng mới"
```

4. Push branch.

```bash
git push origin feature/ten-tinh-nang
```

5. Tạo Pull Request.

---

## 📄 License

Dự án được phát hành theo giấy phép **MIT License**.

Xem thêm tại file:

```text
LICENSE
```

---

## 🌐 Demo

**Website:**
https://cunghocgiaoly-521022870619.asia-southeast1.run.app

---

<p align="center">
  Được xây dựng bằng Next.js, TypeScript và Tailwind CSS.
</p>
