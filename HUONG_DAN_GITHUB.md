# 📚 Hướng Dẫn Đẩy Dự Án Lên GitHub

## 🔐 Bước 1: Tạo Tài Khoản GitHub (Nếu chưa có)

1. Truy cập https://github.com
2. Click "Sign up" và tạo tài khoản
3. Xác nhận email

## 🔑 Bước 2: Tạo Personal Access Token (PAT)

GitHub không còn cho phép dùng password, cần dùng Personal Access Token:

1. Vào GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Đặt tên token (ví dụ: "Game-nguoi-tuyet")
4. Chọn quyền (scopes):
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (nếu cần GitHub Actions)
5. Click "Generate token"
6. **QUAN TRỌNG**: Copy token ngay (chỉ hiện 1 lần) và lưu an toàn

## 📦 Bước 3: Khởi Tạo Git Repository

Mở PowerShell hoặc Command Prompt trong thư mục dự án và chạy:

```bash
# Di chuyển vào thư mục dự án
cd "C:\Users\ADMIN\OneDrive\Desktop\DUAN\Game-nguoi-tuyet"

# Khởi tạo Git repository
git init

# Kiểm tra trạng thái
git status
```

## 📝 Bước 4: Cấu Hình Git (Lần đầu tiên)

```bash
# Cấu hình tên (thay YOUR_NAME bằng tên của bạn)
git config --global user.name "YOUR_NAME"

# Cấu hình email (thay YOUR_EMAIL bằng email GitHub của bạn)
git config --global user.email "YOUR_EMAIL@example.com"

# Kiểm tra cấu hình
git config --list
```

## ➕ Bước 5: Thêm Files vào Git

```bash
# Thêm tất cả files (theo .gitignore)
git add .

# Kiểm tra files sẽ được commit
git status

# Commit lần đầu
git commit -m "Initial commit: Snowman Ski Game"
```

## 🌐 Bước 6: Tạo Repository trên GitHub

1. Đăng nhập GitHub
2. Click nút **"+"** ở góc trên bên phải → **"New repository"**
3. Điền thông tin:
   - **Repository name**: `Game-nguoi-tuyet` (hoặc tên bạn muốn)
   - **Description**: "Snowman Ski Game - HTML5 Canvas Game"
   - **Visibility**: 
     - ✅ **Public** (mọi người có thể xem)
     - ⚠️ **Private** (chỉ bạn xem được)
   - **KHÔNG** tích "Initialize with README" (vì đã có)
   - **KHÔNG** chọn license hoặc .gitignore (đã có sẵn)
4. Click **"Create repository"**

## 🔗 Bước 7: Kết Nối Local Repository với GitHub

Sau khi tạo repository, GitHub sẽ hiển thị hướng dẫn. Chọn phần **"...or push an existing repository from the command line"**

```bash
# Thêm remote repository (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/Game-nguoi-tuyet.git

# Đổi tên branch chính thành main (nếu cần)
git branch -M main

# Push code lên GitHub
git push -u origin main
```

**Lưu ý**: Khi được hỏi username và password:
- **Username**: Tên GitHub của bạn
- **Password**: Dán **Personal Access Token** (PAT) đã tạo ở Bước 2

## ✅ Bước 8: Xác Nhận

1. Refresh trang GitHub repository
2. Bạn sẽ thấy tất cả files đã được upload
3. README.md sẽ tự động hiển thị ở trang chủ repository

## 🔄 Bước 9: Cập Nhật Code Sau Này

Mỗi khi có thay đổi code:

```bash
# Xem thay đổi
git status

# Thêm files đã thay đổi
git add .

# Commit với message mô tả
git commit -m "Mô tả thay đổi của bạn"

# Push lên GitHub
git push
```

## 🛡️ Bảo Mật

### ✅ Đã được bảo vệ bởi .gitignore:
- File hệ thống (.DS_Store, Thumbs.db)
- File editor (.vscode/, .idea/)
- File tạm và backup
- node_modules/ (nếu có)

### ⚠️ Lưu Ý:
- **KHÔNG** commit file chứa thông tin nhạy cảm:
  - API keys
  - Passwords
  - Personal data
- **KHÔNG** commit file quá lớn (>100MB)
- Luôn kiểm tra `git status` trước khi commit

## 🆘 Xử Lý Lỗi Thường Gặp

### Lỗi: "fatal: not a git repository"
```bash
# Chạy lại: git init
```

### Lỗi: "remote origin already exists"
```bash
# Xóa remote cũ
git remote remove origin

# Thêm lại
git remote add origin https://github.com/YOUR_USERNAME/Game-nguoi-tuyet.git
```

### Lỗi: "authentication failed"
- Kiểm tra lại Personal Access Token
- Đảm bảo token có quyền `repo`
- Tạo token mới nếu cần

### Lỗi: "failed to push some refs"
```bash
# Pull code từ GitHub trước
git pull origin main --allow-unrelated-histories

# Sau đó push lại
git push -u origin main
```

## 📚 Tài Liệu Tham Khảo

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [Creating a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## 🎉 Hoàn Thành!

Chúc mừng! Dự án của bạn đã được đẩy lên GitHub an toàn! 🚀

