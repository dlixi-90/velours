# Velours — Frontend

Giao diện React của website thương mại điện tử Velours, xây dựng bằng Vite và Tailwind CSS.

Tài liệu đầy đủ về dự án, kiến trúc, chức năng, biến môi trường, API, kiểm thử và triển khai nằm tại **[README chính](../README.md)**.

## Chạy frontend

Sau khi cài dependency và cấu hình `client/.env` theo [hướng dẫn cài đặt](../README.md#cai-dat), chạy trong thư mục `client`:

```bash
npm run dev
```

Frontend kết nối backend qua `VITE_BACKEND_URL` để sử dụng các chức năng dữ liệu.

## Các lệnh khác

```bash
npm run lint
npm run build
npm run preview
```

Trên PowerShell, nếu `npm.ps1` bị chặn, thay `npm` bằng `npm.cmd`.
