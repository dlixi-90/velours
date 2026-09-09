# VELOURS — Website thương mại điện tử tích hợp trợ lý AI

**Website kinh doanh mỹ phẩm, nước hoa và sản phẩm chăm sóc cá nhân với React, Node.js và MongoDB.**

Velours là ứng dụng web full-stack phục vụ quá trình mua sắm trực tuyến, từ tra cứu sản phẩm, lựa chọn dung tích, quản lý giỏ hàng và địa chỉ đến đặt hàng, thanh toán và theo dõi đơn hàng. Hệ thống cung cấp khu vực quản trị riêng để quản lý danh mục, sản phẩm, tồn kho và hoạt động bán hàng.

Điểm mở rộng của dự án là **trợ lý mua sắm AI có khả năng gọi công cụ truy vấn dữ liệu của cửa hàng**. Trợ lý có thể tìm kiếm, so sánh sản phẩm, xem giỏ hàng và đơn hàng của người đang đăng nhập, đồng thời tạo đề xuất thay đổi giỏ hàng để người dùng xác nhận trên giao diện.

> README mô tả các chức năng và cấu hình trong mã nguồn hiện tại. Tên hiển thị của ứng dụng là **Velours**; tên thư mục repository có thể khác.

## Mục lục

1. [Thông tin dự án](#thong-tin-du-an)
2. [Bài toán, mục tiêu và phạm vi](#muc-tieu)
3. [Chức năng hệ thống](#chuc-nang)
4. [Công nghệ sử dụng](#cong-nghe)
5. [Kiến trúc và tổ chức mã nguồn](#kien-truc)
6. [Thiết kế dữ liệu](#du-lieu)
7. [Quy tắc nghiệp vụ](#nghiep-vu)
8. [Trợ lý mua sắm AI](#tro-ly-ai)
9. [Cài đặt và chạy dự án](#cai-dat)
10. [Cấu hình dịch vụ tích hợp](#dich-vu)
11. [Danh sách trang và API](#api)
12. [Kiểm thử và kiểm tra chất lượng](#kiem-thu)
13. [Triển khai](#trien-khai)
14. [Kịch bản trải nghiệm](#demo)
15. [Xử lý lỗi thường gặp](#xu-ly-loi)
16. [Giới hạn và hướng phát triển](#phat-trien)
17. [Tài liệu, hình ảnh và quyền sử dụng](#tai-lieu)

<a id="thong-tin-du-an"></a>
## 1. Thông tin dự án

| Nội dung | Thông tin |
| --- | --- |
| Tên sản phẩm | Velours |
| Lĩnh vực | Thương mại điện tử — mỹ phẩm, nước hoa và chăm sóc cá nhân |
| Loại ứng dụng | Web full-stack |
| Người sử dụng | Khách truy cập, khách hàng và quản trị viên |
| Chức năng nổi bật | Quản lý tồn kho theo dung tích, thanh toán COD/QR và trợ lý mua sắm AI |

<a id="muc-tieu"></a>
## 2. Bài toán, mục tiêu và phạm vi

### 2.1. Bài toán

Một cửa hàng mỹ phẩm cần quản lý nhiều nhóm sản phẩm, mỗi sản phẩm có thể có nhiều dung tích với giá và tồn kho khác nhau. Khách hàng cần tìm được sản phẩm phù hợp, biết dung tích nào còn hàng và hoàn thành đơn mua thuận tiện. Người quản trị cần cập nhật hàng hóa, theo dõi đơn và quan sát kết quả bán hàng trên một hệ thống thống nhất.

Ngoài luồng mua sắm truyền thống, dự án khai thác giao diện hội thoại để khách hàng đặt câu hỏi bằng ngôn ngữ tự nhiên. Thông tin tư vấn được bổ sung bằng dữ liệu truy vấn từ hệ thống thay vì chỉ dựa vào kiến thức có sẵn của mô hình ngôn ngữ.

### 2.2. Mục tiêu

- Xây dựng giao diện thích ứng với nhiều kích thước màn hình, có tìm kiếm, bộ lọc và phân trang.
- Triển khai xác thực và phân quyền giữa khách hàng với quản trị viên.
- Quản lý sản phẩm theo danh mục, loại, dung tích, giá và tồn kho.
- Hoàn thiện giỏ hàng, địa chỉ giao hàng, đặt hàng COD và thanh toán QR.
- Xử lý đơn hàng và tồn kho bằng transaction để giữ các cập nhật liên quan nhất quán.
- Tích hợp AI gọi công cụ, giới hạn quyền truy cập và xác nhận trước khi sửa giỏ hàng.
- Cung cấp dashboard bán hàng, email xác nhận COD và kiểm thử nghiệp vụ quan trọng.

### 2.3. Đối tượng và phạm vi

| Đối tượng | Nhu cầu chính |
| --- | --- |
| Khách truy cập | Xem cửa hàng, tra cứu và tìm hiểu sản phẩm |
| Khách hàng đăng nhập | Quản lý giỏ hàng, địa chỉ, đặt hàng, theo dõi đơn và sử dụng AI |
| Quản trị viên (`owner`) | Quản lý sản phẩm, danh mục, tồn kho, đơn hàng và thống kê |

Dự án tổ chức theo mô hình **một cửa hàng**, có thể cấu hình nhiều tài khoản quản trị. Giao diện cửa hàng hiện chủ yếu sử dụng tiếng Anh; trợ lý AI có phần giao diện và hướng dẫn tiếng Việt. Các chức năng chưa triển khai được ghi riêng ở [mục 16](#phat-trien).

<a id="chuc-nang"></a>
## 3. Chức năng hệ thống

### 3.1. Cửa hàng và sản phẩm

- Trang chủ giới thiệu cửa hàng, sản phẩm mới, sản phẩm nổi bật và nội dung quảng bá.
- Tìm kiếm sản phẩm theo tên, lọc theo danh mục và loại sản phẩm.
- Sắp xếp giá tăng/giảm, kết hợp phân trang trên frontend.
- Trang chi tiết hiển thị ảnh, mô tả, thành phần nếu có, giá và dung tích lựa chọn.
- Kiểm tra trạng thái bán, số lượng tồn theo dung tích trước khi cho phép mua.
- Hiển thị nhóm sản phẩm liên quan và gợi ý kết hợp trên giao diện.
- Có trang Blog và Contact; phạm vi xử lý hiện tại được ghi tại mục 16.

### 3.2. Tài khoản, giỏ hàng và địa chỉ

- Đăng nhập và quản lý phiên xác thực bằng Clerk.
- Đồng bộ hồ sơ người dùng từ Clerk sang MongoDB thông qua webhook.
- Giỏ hàng gắn với tài khoản, lưu theo sản phẩm và dung tích.
- Thêm hàng, đổi số lượng, xóa dòng hàng và chọn các mặt hàng cần thanh toán.
- Kiểm tra số lượng hợp lệ và tồn kho ở backend.
- Thêm địa chỉ nhận hàng và lựa chọn địa chỉ đã lưu khi thanh toán.
- Kiểm tra địa chỉ đặt hàng thuộc tài khoản đang đăng nhập.

### 3.3. Đơn hàng và thanh toán

- **COD:** tạo đơn, trừ kho, cập nhật giỏ hàng và gửi email xác nhận.
- **QR chuyển khoản:** tạo mã thanh toán, hiển thị QR và nhận giao dịch từ webhook SePay.
- Giữ tồn kho của đơn QR trong thời hạn 5 phút; khôi phục phiên thanh toán còn hiệu lực.
- Hủy đơn QR đang chờ thanh toán và hoàn lại số lượng đã giữ.
- Giao diện kiểm tra trạng thái định kỳ, hiển thị thời gian còn lại và kết quả thanh toán.
- Lưu bản chụp thông tin sản phẩm tại thời điểm mua, hỗ trợ hiển thị đơn cũ khi sản phẩm thay đổi.
- Khách xem danh sách đơn COD và đơn QR đã được ghi nhận thanh toán.

### 3.4. Quản trị cửa hàng

- Dashboard có số đơn, tổng doanh thu đã thanh toán, biểu đồ giá trị đơn theo tháng và sản phẩm có số lượng mua cao.
- Biểu đồ gồm 6 tháng, lấy tháng của đơn mới nhất làm mốc; nếu chưa có đơn thì lấy tháng hiện tại.
- Xem thông tin đơn, sản phẩm, địa chỉ nhận và phương thức thanh toán.
- Cập nhật trạng thái xử lý đơn hàng.
- Thêm, sửa và xóa mềm sản phẩm.
- Upload tối đa 4 ảnh sản phẩm lên Cloudinary; tối đa 5 MB/ảnh, nhận JPEG, PNG và WebP theo bộ lọc MIME.
- Quản lý giá, số lượng tồn và trạng thái bán của từng dung tích.
- Quản lý danh mục và các loại sản phẩm bên trong danh mục.
- Đổi tên danh mục/loại đồng thời cập nhật tên trên sản phẩm trong transaction.
- Chặn xóa danh mục/loại còn được sản phẩm chưa xóa sử dụng.

### 3.5. Trợ lý AI

- Tìm kiếm, xem chi tiết và so sánh sản phẩm từ dữ liệu cửa hàng.
- Tra cứu giỏ hàng và đơn hàng của người đang đăng nhập.
- Đề xuất thêm, sửa số lượng hoặc xóa sản phẩm khỏi giỏ.
- Hiển thị thẻ sản phẩm, đơn hàng, giỏ hàng và nút xác nhận trong khung chat.
- Giới hạn lượt sử dụng theo tài khoản và ghi nhật ký gọi công cụ.

<a id="cong-nghe"></a>
## 4. Công nghệ sử dụng

Các phiên bản sau là **dải phiên bản khai báo trong `package.json`**; phiên bản cài đặt cụ thể do `package-lock.json` quyết định.

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Ngôn ngữ | JavaScript, ES Modules | Dùng chung cho frontend và backend |
| Giao diện | React `^19.2.8` | UI theo component |
| Công cụ frontend | Vite `^8.2.2` | Môi trường phát triển và build |
| Styling | Tailwind CSS `^4.3.3` | Định dạng giao diện và responsive |
| Điều hướng | React Router DOM `^7.18.2` | Các trang cửa hàng/quản trị |
| HTTP client | Axios `^1.20.0` | Gọi API |
| Biểu đồ | Recharts `^3.10.1` | Thống kê dashboard |
| Thành phần UI | Swiper, Lucide React, React Hot Toast | Slider, biểu tượng, thông báo |
| API server | Node.js, Express `^5.2.1` | REST API và webhook |
| Cơ sở dữ liệu | MongoDB, Mongoose `^9.9.4` | Schema, truy vấn, index, transaction |
| Xác thực | `@clerk/react`, `@clerk/express`, Svix | Phiên đăng nhập, xác minh webhook |
| Ảnh sản phẩm | Cloudinary, Multer | Tiếp nhận và lưu ảnh |
| Email | Nodemailer, Brevo SMTP | Email xác nhận COD |
| Thanh toán | QR qua `vietqr.app`, webhook SePay | Tạo QR và đối soát chuyển khoản |
| AI | Groq Chat Completions API | Sinh câu trả lời và gọi công cụ |
| Kiểm thử | Node.js Test Runner, `node:assert/strict` | Kiểm thử nghiệp vụ và AI |
| Phân tích mã | ESLint | Kiểm tra mã frontend |
| Cấu hình triển khai | Vercel | Cấu hình riêng cho client/server |

Trạng thái dùng chung trên frontend được tổ chức bằng React Context và hooks. Backend chia theo routes, middleware, controllers, services, models và utilities.

<a id="kien-truc"></a>
## 5. Kiến trúc và tổ chức mã nguồn

### 5.1. Kiến trúc tổng quan

```mermaid
flowchart LR
    Customer[Khách hàng] --> UI[React SPA]
    Owner[Quản trị viên] --> UI
    UI <--> Clerk[Clerk Authentication]
    UI -->|HTTP API + Bearer token| API[Express API]
    Clerk -->|Webhook có chữ ký| API
    API <--> DB[(MongoDB)]
    API --> Cloudinary[Cloudinary]
    API --> SMTP[Brevo SMTP]
    API <--> Groq[Groq AI]
    SePay[SePay] -->|Webhook giao dịch| API
    UI -->|Tải QR từ URL backend tạo| QR[vietqr.app]
```

Frontend hiển thị dữ liệu và thu thập thao tác. Backend xác thực yêu cầu, kiểm tra quyền, tính giá, kiểm tra tồn kho và ghi dữ liệu. Khóa bí mật của các dịch vụ được cấu hình ở backend.

### 5.2. Cấu trúc thư mục

```text
.
├── README.md
├── .gitignore
├── client/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── vercel.json
│   └── src/
│       ├── main.jsx                  # React root, Clerk, Router, Context
│       ├── App.jsx                   # Route và lazy loading
│       ├── index.css                 # Style dùng chung
│       ├── apis/                     # HTTP client dành cho AI
│       ├── assets/                   # Ảnh, icon và nội dung mẫu
│       ├── components/
│       │   ├── ai/                   # Chat và xác nhận hành động AI
│       │   ├── checkout/             # Form địa chỉ
│       │   └── owner/                # Thành phần quản trị
│       ├── context/                  # Trạng thái ứng dụng, giỏ, API
│       ├── hooks/                    # Điều phối hội thoại AI
│       ├── pages/
│       │   └── owner/                # Dashboard, sản phẩm, danh mục
│       └── utils/                    # Tiền tệ, tồn kho, địa chỉ, giỏ
└── server/
    ├── server.js                     # Express và kết nối dịch vụ
    ├── package.json
    ├── package-lock.json
    ├── vercel.json
    ├── bulkUpload.js                 # Script nhập mẫu, xem mục 9.6
    ├── config/                       # MongoDB, Cloudinary, SMTP
    ├── controllers/                  # Xử lý request và nghiệp vụ
    ├── routes/                       # Endpoint API
    ├── middleware/                   # Auth, quyền, upload, quota AI
    ├── models/                       # Schema Mongoose
    ├── services/
    │   ├── categoryService.js        # Chuẩn hóa, đồng bộ danh mục
    │   └── ai/
    │       ├── auditAIToolCall.js    # Nhật ký công cụ
    │       └── tools/                # Công cụ AI được phép chạy
    ├── utils/                        # Quy tắc tính tiền và tồn kho
    ├── emails/                       # Template email xác nhận
    ├── scripts/                      # Tạo bản xem trước email
    ├── previews/                     # HTML email mẫu
    └── tests/
        ├── core/                     # Kiểm thử cửa hàng
        └── ai/                       # Công cụ, agent, quota
```

### 5.3. Điểm đọc mã nguồn chính

| Nội dung | Tệp |
| --- | --- |
| Trạng thái ứng dụng và giỏ | [AppContext.jsx](client/src/context/AppContext.jsx) |
| Xác thực và phân quyền | [authMiddleware.js](server/middleware/authMiddleware.js) |
| Đồng bộ người dùng | [ClerkWebhooks.js](server/controllers/ClerkWebhooks.js) |
| Đơn hàng, giữ kho, webhook | [orderController.js](server/controllers/orderController.js) |
| Điều phối AI | [aiController.js](server/controllers/aiController.js) |
| Giao diện xác nhận AI | [AIChatPanel.jsx](client/src/components/ai/AIChatPanel.jsx) |
| Phí vận chuyển | [orderPricing.js](server/utils/orderPricing.js) |

<a id="du-lieu"></a>
## 6. Thiết kế dữ liệu

### 6.1. Các model chính

| Model | Dữ liệu tiêu biểu | Ý nghĩa |
| --- | --- | --- |
| `User` | `_id`, `username`, `email`, `image`, `role`, `cartData` | Hồ sơ đồng bộ Clerk và giỏ hàng |
| `Product` | `title`, `description`, `ingredients`, `price`, `sizes`, `stockBySize`, `inStockBySize`, `images`, `category`, `type` | Sản phẩm và biến thể dung tích |
| `Category` | `name`, `nameKey`, `types[]` | Danh mục và loại; tên chuẩn hóa để kiểm tra trùng |
| `Address` | `userId`, họ tên, email, điện thoại, đường, thành phố, tỉnh/bang, mã bưu chính, quốc gia | Địa chỉ nhận hàng |
| `Order` | `userId`, `items[]`, `amount`, `address`, `status`, `paymentMethod`, `isPaid`, thông tin QR | Đơn hàng và thanh toán |
| `AIUsage` | `userId`, `key`, `windowType`, `windowStart`, `count`, `expiresAt` | Bộ đếm lượt AI theo phút/ngày |
| `AIToolAudit` | `requestId`, `userId`, `toolName`, `outcome`, `arguments`, `durationMs`, `expiresAt` | Nhật ký công cụ với tham số đã lọc |

### 6.2. Quan hệ dữ liệu

```mermaid
erDiagram
    USER ||--o{ ADDRESS : "co dia chi"
    USER ||--o{ ORDER : "dat hang"
    ADDRESS ||--o{ ORDER : "nhan hang"
    ORDER ||--|{ ORDER_ITEM : "nhung items"
    PRODUCT ||--o{ ORDER_ITEM : "duoc tham chieu"
    CATEGORY ||--o{ PRODUCT : "lien ket theo ten"
    USER ||--o{ AI_USAGE : "su dung AI"
    USER ||--o{ AI_TOOL_AUDIT : "goi cong cu"
```

Đây là sơ đồ quan hệ logic. `ORDER_ITEM` là phần tử nhúng trong `Order.items`, không phải collection riêng. `Category.types` cũng là mảng nhúng. Sản phẩm lưu tên `category` và `type`, chưa tham chiếu danh mục bằng ObjectId. Giỏ hàng nằm trong `User.cartData`, không có collection `Cart` độc lập.

`User._id` sử dụng chuỗi ID của Clerk. Dòng đơn hàng giữ tham chiếu sản phẩm cùng bản chụp `title`, `image`, `unitPrice`, `size`, `quantity` tại thời điểm mua. Địa chỉ đơn hàng hiện tham chiếu đến `Address`.

### 6.3. Ví dụ cấu trúc biến thể và giỏ hàng

```json
{
  "title": "Sản phẩm minh họa",
  "sizes": ["50ml", "100ml"],
  "price": { "50ml": 250, "100ml": 420 },
  "stockBySize": { "50ml": 10, "100ml": 5 },
  "inStockBySize": { "50ml": true, "100ml": true },
  "inStock": true
}
```

Đây là trích đoạn minh họa, chưa phải payload tạo sản phẩm đầy đủ. Theo quy ước hiện tại, `250` tương ứng **250.000 VNĐ**.

```json
{
  "cartData": {
    "PRODUCT_OBJECT_ID": { "50ml": 2, "100ml": 1 }
  }
}
```

Các index đáng chú ý: `paymentCode` và `transactionId` duy nhất dạng sparse trên đơn hàng, index tìm đơn QR chờ hết hạn, cùng TTL index cho quota và nhật ký AI.

<a id="nghiep-vu"></a>
## 7. Quy tắc nghiệp vụ

### 7.1. Giá và phí vận chuyển

Giá sản phẩm, `unitPrice` và `Order.amount` lưu theo **nghìn VNĐ**. Frontend, email và công cụ AI chuyển sang giá đầy đủ khi hiển thị; `qrAmount` là số tiền chuyển khoản theo VNĐ.

| Quy tắc | Giá trị lưu | Giá trị VNĐ |
| --- | --- | --- |
| Phí giao hàng cho giỏ có hàng dưới ngưỡng miễn phí | `30` | 30.000 VNĐ |
| Ngưỡng miễn phí vận chuyển | `1000` | 1.000.000 VNĐ |
| Chuyển giá sang VNĐ | `Math.round(amount * 1000)` | Ví dụ `250` → 250.000 VNĐ |

```text
Tạm tính = tổng (giá của dung tích × số lượng)
Phí vận chuyển = 0 nếu tạm tính >= 1000; ngược lại là 30 khi có hàng
Tổng đơn = tạm tính + phí vận chuyển
Số tiền QR = làm tròn (tổng đơn × 1000)
```

Backend lấy giá từ database để tính đơn; giá/tổng tiền tự gửi từ trình duyệt không quyết định số tiền phải trả. `VITE_CURRENCY` và `CURRENCY` là nhãn tiền tệ; thay đổi chúng không thực hiện quy đổi tỷ giá.

### 7.2. Tồn kho theo dung tích

Một dung tích được phép mua khi sản phẩm đang bật bán, dung tích không bị tắt và tồn kho lớn hơn 0. Backend kiểm tra lại lúc thêm/cập nhật giỏ và đặt hàng.

Tạo đơn, giữ số lượng tồn và các cập nhật liên quan được thực hiện trong transaction. COD trừ kho khi tạo thành công. QR giữ kho khi bắt đầu chờ thanh toán, sau đó hoàn lại khi hủy hoặc khi hệ thống xử lý hết hạn.

Xóa sản phẩm là **xóa mềm**: đánh dấu `isDeleted`, tắt bán và loại sản phẩm khỏi giỏ người dùng. Đơn cũ vẫn có bản chụp thông tin hàng đã mua.

### 7.3. Luồng COD

```mermaid
sequenceDiagram
    actor Customer as Khách hàng
    participant UI as Frontend
    participant API as Backend
    participant DB as MongoDB
    participant Mail as SMTP
    Customer->>UI: Chọn hàng, địa chỉ và COD
    UI->>API: POST /api/orders/cod
    API->>DB: Kiểm tra địa chỉ, giá và tồn kho
    API->>DB: Transaction tạo đơn, trừ kho, cập nhật giỏ
    DB-->>API: Hoàn tất transaction
    API->>Mail: Gửi email xác nhận COD
    API-->>UI: Trả đơn đã tạo
    UI-->>Customer: Hiển thị kết quả đặt hàng
```

Lỗi gửi email được xử lý riêng, không hủy đơn COD đã tạo thành công. Khi owner chuyển đơn COD sang `Delivery`, backend đánh dấu đã thanh toán và lưu thời điểm thanh toán.

### 7.4. Luồng QR và đối soát

1. Khách gửi mặt hàng và địa chỉ qua `/api/orders/qr`.
2. Backend có thể trả lại đơn QR chờ còn hiệu lực; nếu không có, tạo đơn, giữ kho, sinh mã dạng `DH` kèm 8 ký tự hex và đặt hạn 5 phút.
3. Frontend hiển thị QR, số tiền, nội dung chuyển khoản và bộ đếm; kiểm tra trạng thái mỗi 4 giây.
4. SePay gửi giao dịch đến webhook. Backend kiểm tra API key, chiều tiền vào, mã thanh toán và số tiền.
5. Số tiền **ít nhất bằng** số tiền dự kiến được xem xét ghi nhận; giao dịch thiếu tiền không đánh dấu đơn đã trả.
6. Khi chấp nhận thanh toán, backend đánh dấu `isPaid`, lưu mã giao dịch và cập nhật giỏ.

`transactionId` được kiểm tra để hạn chế xử lý lại giao dịch do webhook gửi lặp. Khi đơn đã ở `Payment Expired` mà tiền đến muộn, backend thử kiểm tra và giữ hàng lại. Nếu hàng không còn đáp ứng, đơn chuyển `Payment Review` để owner xem xét.

**Cách xử lý hết hạn hiện tại:** backend kiểm tra và giải phóng đơn hết hạn khi có các yêu cầu liên quan đến đặt hàng hoặc trạng thái thanh toán. Chưa có tác vụ nền quét độc lập đúng thời điểm mọi đơn hết hạn. Mốc 5 phút là thời hạn nghiệp vụ, không phải cam kết một scheduler hoàn kho ngay giây hết hạn.

### 7.5. Trạng thái đơn

| Giá trị | Ý nghĩa |
| --- | --- |
| `Awaiting Payment` | QR đang chờ tiền chuyển vào |
| `Payment Expired` | Phiên QR đã được xử lý hết hạn |
| `Payment Cancelled` | Khách hủy phiên QR chưa thanh toán |
| `Payment Review` | Đã nhận thanh toán nhưng cần kiểm tra khả năng đáp ứng hàng |
| `Order Placed` | Đã ghi nhận đơn để xử lý |
| `Packing` | Đang đóng gói |
| `Shipping` | Đang giao hàng |
| `Delivery` | Đã giao; giao diện quản trị hiển thị `Delivered` |

Luồng thông thường: `Order Placed → Packing → Shipping → Delivery`. API owner hiện cho phép chọn một trong bốn trạng thái vận hành này, chưa bắt buộc chuyển tuần tự bằng state machine. Tổng doanh thu của API dashboard cộng `amount` của các đơn `isPaid = true`.

<a id="tro-ly-ai"></a>
## 8. Trợ lý mua sắm AI

### 8.1. Cách hoạt động

Frontend gửi tin nhắn và lịch sử đến `/api/ai/chat`. Backend xác thực tài khoản, kiểm tra quota, chuẩn hóa lịch sử rồi gọi Groq. Khi mô hình yêu cầu công cụ, backend thực thi công cụ trong danh sách cho phép, đưa kết quả trở lại hội thoại và trả lời kèm dữ liệu để frontend dựng các thẻ tương tác.

Backend gọi `https://api.groq.com/openai/v1/chat/completions` bằng HTTP `fetch`. Model mặc định trong mã là `openai/gpt-oss-20b`, có thể thay bằng `AI_MODEL` phù hợp với tài khoản Groq và khả năng gọi công cụ. Đây là cấu hình repository, không phải cam kết về danh sách model luôn sẵn có từ nhà cung cấp.

### 8.2. Công cụ được phép sử dụng

| Công cụ | Chức năng | Ghi giỏ hàng trực tiếp? |
| --- | --- | --- |
| `searchProducts` | Tìm sản phẩm và lựa chọn dung tích | Không |
| `getProductDetails` | Tra cứu chi tiết sản phẩm | Không |
| `compareProducts` | So sánh dựa trên dữ liệu truy vấn | Không |
| `getMyOrders` | Tra cứu đơn của tài khoản hiện tại | Không |
| `getMyCart` | Tra cứu giỏ của tài khoản hiện tại | Không |
| `prepareAddToCart` | Chuẩn bị đề xuất thêm hàng | Không |
| `prepareUpdateCart` | Chuẩn bị đề xuất đổi số lượng | Không |
| `prepareRemoveFromCart` | Chuẩn bị đề xuất xóa dòng hàng | Không |

### 8.3. Xác nhận thay đổi giỏ

```mermaid
flowchart TD
    A[Khách yêu cầu thay đổi giỏ] --> B[AI gọi công cụ prepare]
    B --> C[Backend trả đề xuất đã kiểm tra]
    C --> D[Giao diện hiển thị đề xuất]
    D --> E{Khách xác nhận?}
    E -->|Có| F[Gọi API giỏ bằng phiên của khách]
    F --> G[Backend kiểm tra lại và cập nhật giỏ]
    E -->|Hủy| H[Giỏ hàng giữ nguyên]
```

AI chỉ chuẩn bị hành động. Việc ghi dữ liệu diễn ra sau khi khách bấm xác nhận, qua API giỏ có xác thực. Trợ lý không có công cụ tự tạo đơn, thanh toán hoặc quản trị sản phẩm.

### 8.4. Giới hạn và kiểm soát

| Nội dung | Cấu hình hiện tại |
| --- | --- |
| Tin nhắn mới | Tối đa 2.000 ký tự |
| Lịch sử | Tối đa 12 tin nhắn; chỉ vai trò `user`, `assistant` |
| Mỗi tin nhắn lịch sử | Tối đa 4.000 ký tự |
| Tổng độ dài lịch sử | Tối đa 16.000 ký tự |
| Vòng gọi công cụ | Tối đa 3 bước |
| Công cụ thực thi trong một yêu cầu | Tối đa 4 lượt |
| Quota mặc định mỗi tài khoản | 5 yêu cầu/phút, 20 yêu cầu/ngày |
| Lưu audit mặc định | 30 ngày; cấu hình tối đa 365 ngày |

Quota lưu trong MongoDB theo cửa sổ phút/ngày. TTL index dọn bản ghi hết hạn, không bảo đảm xóa ngay thời điểm hết hạn. Nếu kho lưu quota gặp lỗi, middleware từ chối xử lý tiếp yêu cầu AI.

Công cụ giỏ và đơn lấy `userId` từ ngữ cảnh xác thực, không cho mô hình chọn tài khoản khác. Dữ liệu trả từ các công cụ này không bao gồm địa chỉ, email, điện thoại, mã thanh toán/giao dịch. Audit lọc tham số theo danh sách cho phép; với câu tìm kiếm, ghi sự hiện diện và độ dài thay vì toàn văn truy vấn. Nội dung hội thoại cùng dữ liệu công cụ được chọn vẫn được gửi tới Groq để tạo câu trả lời.

### 8.5. Câu hỏi gợi ý khi demo

- “Tìm giúp tôi nước hoa dưới 500.000 đồng.”
- “Sản phẩm này có những dung tích nào còn hàng?”
- “So sánh hai sản phẩm tôi vừa chọn.”
- “Giỏ hàng của tôi hiện có gì?”
- “Cho tôi xem những đơn hàng gần đây.”
- “Thêm 1 sản phẩm này dung tích 100ml vào giỏ.”

Tên sản phẩm, dung tích và ngân sách cần phù hợp dữ liệu đã tạo. Nếu thiếu thông tin xác định sản phẩm/dung tích, trợ lý được hướng dẫn hỏi lại trước khi tạo đề xuất.

<a id="cai-dat"></a>
## 9. Cài đặt và chạy dự án

### 9.1. Điều kiện chuẩn bị

- Git, Node.js và npm. Có thể dùng **Node.js 22.13 trở lên trong nhánh 22** hoặc Node.js 24 để đáp ứng engine của công cụ đã cài trong dự án.
- MongoDB hỗ trợ transaction: cluster MongoDB Atlas hoặc MongoDB cấu hình replica set. MongoDB standalone không đủ để chạy đầy đủ luồng đặt hàng và quản lý danh mục.
- Ứng dụng Clerk và endpoint webhook truy cập được từ Internet.
- Cloudinary để tải ảnh; Brevo SMTP, SePay và Groq nếu chạy tính năng tương ứng.

Repository có hai package độc lập, không có lệnh npm chung ở thư mục gốc.

### 9.2. Lấy mã nguồn và cài dependency

Thay URL ví dụ bằng repository của bạn:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git velours
cd velours
npm --prefix server ci
npm --prefix client ci
```

Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay `npm`, ví dụ `npm.cmd --prefix client ci`.

### 9.3. Tạo `client/.env`

```dotenv
VITE_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_ME
VITE_BACKEND_URL=http://localhost:3000
VITE_CURRENCY=VND
```

| Biến | Ý nghĩa |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Publishable key cùng ứng dụng Clerk với backend; bắt buộc để frontend khởi tạo |
| `VITE_BACKEND_URL` | URL gốc backend, không thêm `/api` vì lời gọi đã có tiền tố này |
| `VITE_CURRENCY` | Nhãn tiền tệ trên giao diện |

Biến `VITE_*` được đưa vào mã trình duyệt. Chỉ đặt khóa công khai và cấu hình frontend ở đây; secret key thuộc server.

### 9.4. Tạo `server/.env`

```dotenv
# Server và database
PORT=3000
MONGO_URI=mongodb+srv://DB_USER:DB_PASSWORD@YOUR_CLUSTER/velours?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5173
CURRENCY=VND

# Clerk — cùng ứng dụng với frontend
CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_ME
CLERK_SECRET_KEY=sk_test_REPLACE_ME
CLERK_WEBHOOK_SECRET=whsec_REPLACE_ME
ADMIN_EMAILS=owner@example.com

# Cloudinary
CLDN_NAME=REPLACE_ME
CLDN_API_KEY=REPLACE_ME
CLDN_API_SECRET=REPLACE_ME

# Brevo SMTP
SMTP_USER=REPLACE_ME
SMTP_PASS=REPLACE_ME
SMTP_SENDER_EMAIL=verified-sender@example.com

# QR / SePay
SEPAY_BANK_CODE=REPLACE_ME
SEPAY_ACCOUNT_NUMBER=REPLACE_ME
SEPAY_ACCOUNT_NAME=REPLACE_ME
SEPAY_WEBHOOK_API_KEY=REPLACE_WITH_A_PRIVATE_RANDOM_KEY

# Groq AI
GROQ_API_KEY=REPLACE_ME
AI_MODEL=openai/gpt-oss-20b
AI_RATE_LIMIT_PER_MINUTE=5
AI_RATE_LIMIT_PER_DAY=20
AI_AUDIT_RETENTION_DAYS=30
```

Giá trị mẫu cần thay bằng cấu hình môi trường của bạn, không phải thông tin đăng nhập dùng ngay.

| Nhóm biến | Yêu cầu / tác dụng |
| --- | --- |
| `PORT` | Tùy chọn, mặc định `3000` |
| `MONGO_URI` | Bắt buộc để kết nối database |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Cấu hình SDK Clerk server |
| `CLERK_WEBHOOK_SECRET` | Xác minh webhook đồng bộ người dùng |
| `ADMIN_EMAILS` | Email owner phân cách bằng dấu phẩy |
| `ADMIN_EMAIL` | Biến cũ, dùng khi không có `ADMIN_EMAILS`; không cần đặt cả hai |
| `CLDN_NAME`, `CLDN_API_KEY`, `CLDN_API_SECRET` | Upload ảnh sản phẩm |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER_EMAIL` | Gửi email COD bằng Brevo |
| `FRONTEND_URL` | URL cửa hàng trong email |
| `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER` | Thông tin tài khoản tạo QR |
| `SEPAY_ACCOUNT_NAME` | Tùy chọn, tên chủ tài khoản hiển thị trong QR |
| `SEPAY_WEBHOOK_API_KEY` | Khóa đối chiếu webhook thanh toán |
| `GROQ_API_KEY` | Bắt buộc khi dùng AI |
| `AI_MODEL` | Tùy chọn, mặc định như ví dụ |
| `AI_RATE_LIMIT_PER_MINUTE`, `AI_RATE_LIMIT_PER_DAY` | Số nguyên dương; mặc định 5 và 20 |
| `AI_AUDIT_RETENTION_DAYS` | Ngày lưu audit; mặc định 30, tối đa 365 |
| `CURRENCY` | Nhãn tiền từ công cụ AI, mặc định `VND` |

Tệp `.env` bị loại bởi `.gitignore` hiện tại. Repository chưa có `.env.example`; dùng hai khối cấu hình trên để tạo tệp cục bộ. Không đưa khóa bí mật thật vào README hoặc repository.

### 9.5. Chạy môi trường phát triển

Terminal thứ nhất chạy backend:

```bash
cd server
npm run server
```

Terminal thứ hai bắt đầu từ thư mục gốc, chạy frontend:

```bash
cd client
npm run dev
```

| Thành phần | Địa chỉ mặc định |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Kiểm tra server | `GET http://localhost:3000/` |
| Quản trị | `http://localhost:5173/owner` |

Endpoint gốc trả `API Successfully connected` khi server đã khởi tạo. Đây là kiểm tra phản hồi cơ bản, chưa kiểm tra đầy đủ mọi dịch vụ. Nếu Vite dùng cổng khác, lấy URL thực tế từ terminal và cập nhật cấu hình liên quan. Khởi động lại tiến trình sau khi thay `.env`.

### 9.6. Tạo dữ liệu ban đầu

1. Hoàn thành webhook Clerk ở mục 10.1, đăng ký tài khoản và bảo đảm người dùng được đồng bộ vào MongoDB.
2. Thêm email quản trị vào `ADMIN_EMAILS`, khởi động lại backend.
3. Đăng nhập, mở `/owner/add-category` để tạo danh mục và loại.
4. Mở `/owner/add-product`, nhập thông tin, chọn danh mục/loại, khai báo dung tích, giá, tồn kho và ảnh.
5. Bật dung tích cần bán, kiểm tra sản phẩm ở `/collection`.

Backend đồng bộ danh mục/loại từ sản phẩm chưa xóa đang có khi khởi động. Database trống không tự có đầy đủ sản phẩm hoặc danh mục mẫu.

`client/src/assets/data.js` chứa tài nguyên và nội dung mẫu giao diện, không phải seed database. `server/bulkUpload.js` là script nhập riêng: tìm ảnh trong `server/images`, tải lên Cloudinary và tạo sản phẩm. Script chưa thiết lập `stockBySize`/`inStockBySize`, chưa chống nhập trùng và không phải bước bắt buộc để chạy dự án. Nếu dùng, cần chuẩn bị ảnh, kiểm tra dữ liệu, bổ sung tồn kho và kiểm tra đồng bộ danh mục trước khi demo.

<a id="dich-vu"></a>
## 10. Cấu hình dịch vụ tích hợp

Các endpoint và biến sau phản ánh hợp đồng tích hợp trong mã nguồn. Tên mục trên dashboard nhà cung cấp có thể thay đổi.

### 10.1. Clerk và quyền quản trị

- Dùng cùng ứng dụng Clerk cho frontend/backend.
- Webhook: `https://YOUR_BACKEND_DOMAIN/api/clerk`.
- Đăng ký `user.created`, `user.updated`, `user.deleted`.
- Đặt signing secret vào `CLERK_WEBHOOK_SECRET`.
- Khi chạy cục bộ, cần URL công khai chuyển tiếp đến backend; Clerk không truy cập trực tiếp `localhost` trên máy cá nhân.
- Tài khoản tạo trước khi webhook hoạt động cần đồng bộ lại bằng sự kiện phù hợp. Đăng nhập Clerk thành công chưa bảo đảm có document `User` trong MongoDB.

Middleware đọc hồ sơ MongoDB rồi xác định vai trò theo email quản trị ở mỗi request được bảo vệ. Email được chuẩn hóa chữ thường, bỏ khoảng trắng. Sửa `role` thủ công trong database có thể bị ghi lại theo `ADMIN_EMAILS`.

API quản trị dùng cả `authUser` và `requireOwner`; kiểm soát quyền không chỉ ở giao diện `/owner`.

### 10.2. Cloudinary

Khai báo cloud name, API key, API secret ở backend. Form tạo/sửa sản phẩm dùng `multipart/form-data`: `productData` là chuỗi JSON, `images` chứa tệp ảnh. Sản phẩm lưu URL Cloudinary. File tạm của request được dọn trong xử lý upload của controller.

### 10.3. Brevo SMTP

Transporter dùng host cố định `smtp-relay.brevo.com`, cổng `587`; đăng nhập bằng `SMTP_USER`, `SMTP_PASS`. `SMTP_SENDER_EMAIL` cần phù hợp cấu hình người gửi trên Brevo. Đổi host cần sửa [nodemailer.js](server/config/nodemailer.js), vì chưa có `SMTP_HOST` hoặc `SMTP_PORT`.

Email COD gồm thông tin đơn, hàng, số lượng, giá, địa chỉ nhận. Tạo bản xem trước mà không gửi email:

```bash
npm --prefix server run preview:email
```

Kết quả: [server/previews/order-confirmation.html](server/previews/order-confirmation.html). Email tự động hiện được gọi khi tạo COD; webhook QR chưa gọi gửi xác nhận.

### 10.4. QR và SePay

- Đặt ngân hàng, tài khoản nhận, tên tài khoản trong các biến `SEPAY_*`.
- Webhook: `https://YOUR_BACKEND_DOMAIN/api/orders/sepay-webhook`.
- Cấu hình header `Authorization: Apikey YOUR_WEBHOOK_KEY`, khớp `SEPAY_WEBHOOK_API_KEY`.
- Các trường đang xử lý: `id`, `transferType`, `transferAmount`, `content`, `code`.
- Nội dung chuyển khoản chứa mã thanh toán backend sinh; số tiền dùng VNĐ đầy đủ.

Hiển thị được QR chưa chứng minh thanh toán hoàn tất. Cần kiểm tra webhook được nhận, đối chiếu đúng đơn và frontend đọc được trạng thái mới.

### 10.5. Groq

Đặt `GROQ_API_KEY` ở backend. Nếu đổi model, cấu hình `AI_MODEL` và kiểm tra khả năng gọi công cụ. Repository không có database vector hoặc bước huấn luyện model riêng; AI truy vấn catalog và dữ liệu nghiệp vụ qua các công cụ.

<a id="api"></a>
## 11. Danh sách trang và API

### 11.1. Route frontend

| Đường dẫn | Chức năng |
| --- | --- |
| `/` | Trang chủ |
| `/collection` | Sản phẩm, tìm kiếm và lọc |
| `/collection/:productId` | Chi tiết sản phẩm |
| `/blog` | Blog mẫu |
| `/contact` | Giao diện liên hệ |
| `/cart` | Giỏ và thanh toán |
| `/my-orders` | Đơn của khách |
| `/owner` | Dashboard |
| `/owner/add-product` | Thêm sản phẩm |
| `/owner/edit-product/:productId` | Sửa sản phẩm |
| `/owner/list-product` | Danh sách sản phẩm quản trị |
| `/owner/add-category` | Danh mục và loại |

### 11.2. Quy ước API

- Base URL phát triển: `http://localhost:3000`.
- API người dùng cần `Authorization: Bearer <CLERK_SESSION_TOKEN>`.
- `Owner` nghĩa là đăng nhập hợp lệ và có quyền quản trị.
- Request thường dùng JSON; upload dùng `multipart/form-data`; webhook Clerk cần raw body để xác minh chữ ký.
- Phần lớn phản hồi JSON có `success`, kèm `message` và/hoặc dữ liệu.

### 11.3. Tài khoản, địa chỉ và giỏ

| Method | Endpoint | Quyền | Chức năng |
| --- | --- | --- | --- |
| `GET` | `/` | Công khai | Kiểm tra server |
| `POST` | `/api/clerk` | Chữ ký Svix | Nhận sự kiện Clerk |
| `GET` | `/api/users` | Đăng nhập | Lấy `role`, `cartData` |
| `GET` | `/api/addresses` | Đăng nhập | Lấy địa chỉ tài khoản |
| `POST` | `/api/addresses/add` | Đăng nhập | Thêm địa chỉ |
| `POST` | `/api/cart/add` | Đăng nhập | Thêm sản phẩm/dung tích |
| `POST` | `/api/cart/update` | Đăng nhập | Đặt số lượng; 0 để xóa |

### 11.4. Sản phẩm và danh mục

| Method | Endpoint | Quyền | Chức năng |
| --- | --- | --- | --- |
| `GET` | `/api/products` | Công khai | Sản phẩm chưa xóa |
| `GET` | `/api/products/single?productId=...` | Công khai | Chi tiết sản phẩm |
| `POST` | `/api/products` | Owner | Tạo sản phẩm, upload ảnh |
| `PUT` | `/api/products/:productId` | Owner | Sửa sản phẩm |
| `DELETE` | `/api/products/:productId` | Owner | Xóa mềm |
| `POST` | `/api/products/toggle-stock` | Owner | Trạng thái bán tổng/từng dung tích |
| `GET` | `/api/categories` | Công khai | Lấy danh mục và loại |
| `POST` | `/api/categories` | Owner | Thêm danh mục |
| `PUT` | `/api/categories/:categoryId` | Owner | Sửa tên danh mục |
| `DELETE` | `/api/categories/:categoryId` | Owner | Xóa danh mục không được sử dụng |
| `POST` | `/api/categories/:categoryId/types` | Owner | Thêm loại |
| `PUT` | `/api/categories/:categoryId/types/:typeId` | Owner | Sửa loại |
| `DELETE` | `/api/categories/:categoryId/types/:typeId` | Owner | Xóa loại không được sử dụng |

### 11.5. Đơn, thanh toán và AI

| Method | Endpoint | Quyền | Chức năng |
| --- | --- | --- | --- |
| `POST` | `/api/orders/cod` | Đăng nhập | Tạo COD |
| `POST` | `/api/orders/qr` | Đăng nhập | Tạo/khôi phục QR còn hiệu lực |
| `GET` | `/api/orders/pending-payment` | Đăng nhập | Phiên QR chờ của khách |
| `GET` | `/api/orders/:orderId` | Đăng nhập | Trạng thái đơn thuộc tài khoản |
| `POST` | `/api/orders/:orderId/cancel` | Đăng nhập | Hủy QR đủ điều kiện |
| `POST` | `/api/orders/userorders` | Đăng nhập | Đơn COD và QR đã trả của khách |
| `GET` | `/api/orders` | Owner | Dữ liệu đơn và dashboard |
| `POST` | `/api/orders/status` | Owner | Cập nhật trạng thái |
| `POST` | `/api/orders/sepay-webhook` | API key riêng | Nhận giao dịch |
| `POST` | `/api/ai/chat` | Đăng nhập + quota | Hội thoại AI |

### 11.6. Payload minh họa

Các ID dưới đây là placeholder, cần thay bằng ID thật trong database.

**Thêm giỏ — `POST /api/cart/add`:**

```json
{
  "itemId": "PRODUCT_OBJECT_ID",
  "size": "100ml",
  "quantity": 1
}
```

**Tạo đơn — `POST /api/orders/cod` hoặc `/api/orders/qr`:**

```json
{
  "items": [
    { "product": "PRODUCT_OBJECT_ID", "size": "100ml", "quantity": 1 }
  ],
  "address": "ADDRESS_OBJECT_ID"
}
```

`address` là ID địa chỉ đã lưu. Không cần gửi tổng tiền hay `userId`: backend tính tiền và lấy người dùng từ phiên xác thực.

**Chat — `POST /api/ai/chat`:**

```json
{
  "message": "Tìm giúp tôi nước hoa dưới 500.000 đồng",
  "history": []
}
```

Phần tử lịch sử dùng `{ "role": "user", "content": "..." }` hoặc vai trò `assistant`. Phản hồi có `message`, `toolsUsed`, `products`, `orders`, `cart`, `pendingCartAction` khi có dữ liệu tương ứng.

<a id="kiem-thu"></a>
## 12. Kiểm thử và kiểm tra chất lượng

### 12.1. Các lệnh sẵn có

Chạy từ thư mục gốc:

```bash
# Toàn bộ kiểm thử backend
npm --prefix server test

# Chỉ AI
npm --prefix server run test:ai

# Phân tích mã frontend
npm --prefix client run lint

# Build frontend
npm --prefix client run build

# Xem bản build cục bộ
npm --prefix client run preview
```

### 12.2. Phạm vi kiểm thử

| Nhóm | Nội dung |
| --- | --- |
| Email | Bản chụp giá mua, tổng đã lưu, COD, escape HTML, URL không an toàn |
| Danh mục | Cập nhật/xóa, đồng bộ sản phẩm, liên kết và lỗi |
| Đơn và quyền | Owner, email quản trị, dữ liệu webhook, hoàn kho QR, COD khi giao xong |
| Giá/tồn kho | Miễn phí vận chuyển, trạng thái dung tích |
| Công cụ AI | Tìm kiếm, chi tiết, so sánh, quy đổi giá |
| Dữ liệu AI | Phạm vi tài khoản, prepare không ghi, audit, xác nhận giỏ |
| Controller/agent | Input/history, lỗi dịch vụ, chuỗi công cụ, giới hạn gọi |
| Quota | Xác thực, headers, giới hạn phút, lỗi MongoDB |

Test dùng Node.js Test Runner, mock/stub thành phần liên quan và chạy tuần tự với `--test-concurrency=1`. Unit test không thay thế chạy thử đầy đủ với MongoDB, Clerk, Cloudinary, SMTP, SePay và Groq thật. Chưa có E2E trình duyệt hoặc báo cáo tỷ lệ coverage công bố.

Khi cập nhật README, kiểm tra cục bộ ghi nhận **64/64 bài kiểm thử backend đạt**, lint và build frontend thành công. Đây là kết quả tại thời điểm kiểm tra, không phải badge CI tự cập nhật hoặc chứng nhận mọi dịch vụ đã được thử đầu cuối.

### 12.3. Ca kiểm tra thủ công

| Ca kiểm tra | Kết quả cần quan sát |
| --- | --- |
| Khách thường gọi API owner | Bị từ chối |
| Dung tích tồn 0/tắt bán | Không mua được |
| Sửa giá/tổng trong request | Đơn tính theo backend |
| Dùng địa chỉ tài khoản khác | Đặt hàng bị từ chối |
| COD thành công | Có đơn, kho giảm, giỏ cập nhật; email nếu cấu hình |
| QR rồi hủy | Hoàn kho, đơn chuyển hủy |
| QR hết hạn | Request kiểm tra xử lý hết hạn, hoàn lượng giữ |
| SePay gửi lặp | Không ghi nhận thanh toán lặp |
| AI đề xuất thêm giỏ | Giỏ chưa đổi trước xác nhận |
| Hai tài khoản hỏi đơn qua AI | Mỗi phiên chỉ có dữ liệu tài khoản tương ứng |

<a id="trien-khai"></a>
## 13. Triển khai

Có [client/vercel.json](client/vercel.json) và [server/vercel.json](server/vercel.json). Có thể tổ chức frontend/backend thành hai project riêng.

| Cấu hình | Frontend | Backend |
| --- | --- | --- |
| Root Directory | `client` | `server` |
| Cài dependency | `npm ci` | `npm ci` |
| Build | `npm run build` | Entry và cấu hình Node trong `vercel.json` |
| Output | `dist` | Theo cấu hình backend |
| Biến môi trường | `VITE_*` | Biến của `server/.env` |

Frontend rewrite về `index.html` hỗ trợ truy cập trực tiếp route React Router. Backend định tuyến về `server.js`. Cấu hình có sẵn là điểm bắt đầu; vẫn cần xác nhận runtime, quyền ghi file tạm, database và thời gian thực thi ở môi trường đích.

1. Chuẩn bị database hỗ trợ transaction và dịch vụ cần dùng.
2. Triển khai backend, khai báo biến môi trường, kiểm tra endpoint gốc.
3. Triển khai frontend với `VITE_BACKEND_URL` trỏ đến backend.
4. Cập nhật `FRONTEND_URL`, domain Clerk, webhook Clerk/SePay sang URL công khai.
5. Build lại frontend nếu đổi `VITE_*`; chạy lại đăng nhập, quản trị, COD, QR, AI.

Trên máy chủ Node.js riêng, dùng `npm start` trong `server/`; phục vụ `client/dist` bằng web server có SPA fallback. Repository chưa có workflow CI/CD hoặc xác nhận triển khai production tự động.

<a id="demo"></a>
## 14. Kịch bản trải nghiệm

### 14.1. Chuẩn bị

- Tài khoản khách và owner đã đồng bộ Clerk.
- Vài danh mục, loại và sản phẩm nhiều dung tích, khác giá/tồn kho.
- Một dung tích hết hàng để minh họa kiểm tra nghiệp vụ.
- Địa chỉ thử nghiệm và các đơn khác trạng thái để dashboard có dữ liệu.
- Kiểm tra khóa AI, quota, webhook trước khi trình bày.
- Ảnh/video dự phòng cho phần phụ thuộc dịch vụ bên ngoài.

### 14.2. Trình tự đề xuất

| Bước | Thao tác | Nội dung kỹ thuật |
| --- | --- | --- |
| 1 | Trang chủ, bộ sưu tập | Bài toán, component, responsive, routing |
| 2 | Tìm, lọc, sắp xếp | Trạng thái, xử lý danh sách |
| 3 | Chi tiết, đổi dung tích | Giá/tồn theo biến thể |
| 4 | Đăng nhập, thêm hàng, chọn hàng thanh toán | Clerk, Context, giỏ MongoDB |
| 5 | Địa chỉ, COD | Giá server, transaction, email |
| 6 | QR, xác nhận hoặc hủy/hết hạn | Webhook, polling, hoàn kho |
| 7 | AI tìm/so sánh, đề xuất giỏ | Tool calling, dữ liệu, xác nhận |
| 8 | Owner sửa sản phẩm/danh mục | Quyền, upload, nhất quán |
| 9 | Cập nhật đơn, dashboard | Trạng thái, doanh thu, biểu đồ |
| 10 | Test và giới hạn | Phạm vi kiểm chứng, hướng mở rộng |

Thanh toán thật cần môi trường/tài khoản thử nghiệm phù hợp. Nếu mô phỏng webhook trong môi trường phát triển, ghi rõ là mô phỏng khi báo cáo kết quả.

<a id="xu-ly-loi"></a>
## 15. Xử lý lỗi thường gặp

| Hiện tượng | Nguyên nhân cần kiểm tra | Hướng xử lý |
| --- | --- | --- |
| `Missing Publishable Key` | Thiếu Clerk frontend | Điền `VITE_CLERK_PUBLISHABLE_KEY`, khởi động lại Vite |
| Clerk vào được, API `401` | User chưa đồng bộ, token thiếu/hết hạn, khác ứng dụng | Kiểm tra webhook, document `User`, cấu hình hai phía |
| Không vào quản trị | Email ngoài danh sách owner | Cập nhật `ADMIN_EMAILS`, khởi động lại server, tải lại phiên |
| `Database connection failed` | URI, tài khoản, quyền kết nối | Kiểm tra `MONGO_URI`, database, mạng |
| Lỗi transaction | MongoDB standalone | Atlas hoặc replica set |
| Sản phẩm không hiện Collection | Không còn dung tích đang bán/còn hàng | Kiểm tra `inStock`, `stockBySize`, `inStockBySize`, `isDeleted` |
| Không tạo được sản phẩm | Danh mục/loại, dữ liệu, ảnh | Tạo danh mục trước; kiểm tra dung tích, giới hạn ảnh |
| Không gửi email | SMTP hoặc người gửi | Kiểm tra Brevo, biến SMTP, log; đối chiếu đơn vẫn được tạo |
| QR chưa đổi sau chuyển tiền | Webhook không đến, sai key/mã, thiếu tiền | Kiểm tra URL, header, giao dịch |
| Giá gấp 1.000 lần | Nhập VNĐ vào trường nghìn VNĐ | 250.000 VNĐ nhập `250` |
| AI chưa cấu hình | Thiếu `GROQ_API_KEY` | Thêm khóa backend, khởi động lại |
| AI `429` | Quota ứng dụng/Groq | Kiểm tra thông báo, quota, tài khoản dịch vụ |
| URL có `/api/api/...` | Base URL chứa `/api` | Đặt `VITE_BACKEND_URL` thành URL gốc |
| Reload route bị 404 | Thiếu SPA fallback | Rewrite frontend |
| Chặn `npm.ps1` | Chính sách PowerShell | Dùng `npm.cmd` |

<a id="phat-trien"></a>
## 16. Giới hạn và hướng phát triển

### 16.1. Giới hạn hiện tại

- Blog dùng nội dung mẫu từ assets, chưa có CMS/API bài viết. Contact là giao diện, chưa có API tiếp nhận/gửi liên hệ.
- Nội dung đánh giá mẫu và gợi ý sản phẩm chưa tương đương hệ thống đánh giá khách hàng hoặc đề xuất được huấn luyện riêng.
- Chưa có voucher, wishlist, hoàn trả/hoàn tiền tự động, đơn vị vận chuyển hoặc đa nhà bán hàng.
- Catalog lọc/sắp xếp/phân trang ở frontend, chưa có phân trang server cho dữ liệu lớn.
- Email tự động ở COD, chưa gọi khi QR nhận tiền.
- QR hết hạn dọn theo request, chưa có worker/scheduler. `Payment Review` cần xử lý nghiệp vụ thủ công, chưa có hoàn tiền tích hợp.
- API trạng thái chưa cưỡng chế toàn bộ quy tắc chuyển trạng thái.
- Hội thoại nằm trong trạng thái frontend, gửi theo request, chưa có model lưu dài hạn.
- Giới hạn công cụ, xác nhận và lọc dữ liệu thu hẹp quyền AI; chất lượng trả lời vẫn cần đánh giá thực nghiệm.
- Backend dùng `cors()` mặc định, chưa cấu hình allowlist domain riêng.
- Chưa công bố kiểm thử tải, E2E, độ chính xác AI hoặc số liệu hiệu năng.

### 16.2. Hướng phát triển

Các mục này là định hướng, **chưa phải chức năng hoàn thành**:

- [ ] Chuẩn hóa tiền tệ sang số nguyên VNĐ và migration dữ liệu.
- [ ] Phân trang, bộ lọc và tìm kiếm backend.
- [ ] State machine đơn, lịch sử trạng thái và hoàn trả.
- [ ] Scheduler giải phóng kho QR, hàng đợi email.
- [ ] Đơn vị vận chuyển, mã vận đơn, phí theo địa chỉ.
- [ ] Đánh giá sản phẩm, wishlist, khuyến mãi.
- [ ] Blog/Contact hoàn chỉnh, tiếng Việt, khả năng truy cập.
- [ ] Lưu hội thoại theo lựa chọn người dùng, bộ câu hỏi đánh giá AI.
- [ ] E2E, kiểm thử database thật, đồng thời và coverage.
- [ ] CI/CD, giám sát lỗi, CORS theo môi trường, sao lưu.

<a id="tai-lieu"></a>
## 17. Tài liệu, hình ảnh và quyền sử dụng

### 17.1. Tài liệu hỗ trợ dự án

| Tài liệu | Nội dung đề xuất |
| --- | --- |
| Tài liệu kỹ thuật | Yêu cầu, thiết kế, triển khai và vận hành |
| UML | Use case, activity, sequence, mô hình dữ liệu chi tiết |
| Video | Khách, owner, thanh toán, AI |
| Minh chứng test | Kết quả, ca thủ công, giới hạn kiểm chứng |

### 17.2. Hình ảnh giao diện

Chưa có bộ ảnh chụp riêng cho README. Có thể đặt ảnh trong `docs/screenshots/` sau khi chụp ứng dụng bằng dữ liệu demo rồi chèn đường dẫn tương đối. Nên có các màn hình:

1. Trang chủ và bộ sưu tập.
2. Chi tiết nhiều dung tích.
3. Giỏ và địa chỉ.
4. QR và kết quả đặt hàng.
5. AI với thẻ sản phẩm, xác nhận giỏ.
6. Dashboard, sản phẩm, danh mục quản trị.

Không đưa dữ liệu cá nhân thật, token hoặc cấu hình bí mật vào ảnh.

### 17.3. Quyền sử dụng và ghi nhận nguồn

Repository chưa có `LICENSE` ở thư mục gốc; trường `license: "ISC"` trong `server/package.json` chưa thay thế việc xác định giấy phép cho toàn bộ mã nguồn và tài nguyên.

Trước khi công bố rộng rãi, tác giả cần chọn giấy phép phù hợp, ghi nhận mã nguồn/tài liệu tham khảo nếu có và xác nhận quyền sử dụng ảnh, nội dung mẫu.
