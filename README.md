# MoneySmartflow - Quản lý tài chính cá nhân

**MoneySmartflow** là ứng dụng quản lý tài chính cá nhân thông minh, tích hợp trí tuệ nhân tạo (Gemini AI) cho phép người dùng nhập liệu giao dịch thu chi nhanh chóng bằng cả giọng nói tiếng Việt tự nhiên và bàn phím.

---

## 🌟 Tính năng nổi bật

- 🎙️ **Nhập liệu bằng giọng nói (Voice-to-Text)**: Nhận diện giọng nói tiếng Việt tự nhiên, tự động trích xuất số tiền, loại giao dịch (Chi tiêu/Thu nhập), danh mục và mô tả.
- ⌨️ **Nhập liệu văn bản song song**: Hỗ trợ ô gõ phím trực tiếp hiển thị cạnh nút micro.
- 🧠 **Trí tuệ nhân tạo Gemini AI**: Hiểu ngữ cảnh tiếng Việt thông minh (tự động nhận diện các số đơn lẻ như 300, 50 thành nghìn đồng: 300.000đ, 50.000đ).
- 🏷️ **Hệ thống 8 Danh mục chuẩn**:
  - **Chi tiêu**: Ăn uống, Di chuyển, Hóa đơn & Điện nước, Mua sắm/Giải trí, Sức khỏe, Con cái, Trả nợ.
  - **Thu nhập**: Thu nhập.
- 📊 **Báo cáo trực quan**: Biểu đồ phân tích thu chi với Recharts theo chuẩn thiết kế iOS Clean Interface.
- ☁️ **Đồng bộ Supabase & LocalStorage**: Lưu trữ đám mây qua Supabase kèm fallback lưu tại trình duyệt khi chưa cấu hình Supabase.

---

## 🚀 Hướng dẫn chạy dự án

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Cấu hình biến môi trường
Tạo file `.env.local` ở thư mục gốc:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Chạy môi trường phát triển
```bash
npm run dev
```
Truy cập ứng dụng tại `http://localhost:3000`.

---

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **AI Integration**: Google Generative AI (@google/generative-ai - Gemini 1.5 Flash).
- **Backend / Database**: Supabase (PostgreSQL), Next.js API Routes.

---

## 📄 Bản quyền & Thương hiệu

- **Tên thương hiệu chính thức**: MoneySmartflow
- **Slogan chính thức**: Quản lý tài chính cá nhân
