# Script hỗ trợ đẩy dự án lên GitHub
# Chạy script này sau khi đã tạo repository trên GitHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Đẩy Dự Án Lên GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Git đã được cài đặt
try {
    $gitVersion = git --version
    Write-Host "✓ Git đã được cài đặt: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git chưa được cài đặt. Vui lòng cài đặt Git trước." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Kiểm tra đã có remote chưa
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "⚠ Remote 'origin' đã tồn tại: $remoteExists" -ForegroundColor Yellow
    $overwrite = Read-Host "Bạn có muốn thay đổi remote? (y/n)"
    if ($overwrite -eq "y" -or $overwrite -eq "Y") {
        git remote remove origin
        Write-Host "✓ Đã xóa remote cũ" -ForegroundColor Green
    } else {
        Write-Host "Giữ nguyên remote hiện tại" -ForegroundColor Yellow
    }
}

Write-Host ""

# Nhập thông tin GitHub
Write-Host "Nhập thông tin GitHub repository:" -ForegroundColor Cyan
$username = Read-Host "GitHub Username"
$repoName = Read-Host "Repository Name (mặc định: Game-nguoi-tuyet)"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "Game-nguoi-tuyet"
}

$remoteUrl = "https://github.com/$username/$repoName.git"
Write-Host ""
Write-Host "Remote URL sẽ là: $remoteUrl" -ForegroundColor Yellow
$confirm = Read-Host "Xác nhận? (y/n)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Đã hủy." -ForegroundColor Red
    exit 0
}

# Thêm remote
if (-not $remoteExists -or $overwrite -eq "y" -or $overwrite -eq "Y") {
    git remote add origin $remoteUrl
    Write-Host "✓ Đã thêm remote: $remoteUrl" -ForegroundColor Green
}

Write-Host ""

# Kiểm tra trạng thái
Write-Host "Kiểm tra trạng thái Git..." -ForegroundColor Cyan
git status

Write-Host ""
$addFiles = Read-Host "Thêm tất cả files vào Git? (y/n)"
if ($addFiles -eq "y" -or $addFiles -eq "Y") {
    git add .
    Write-Host "✓ Đã thêm files vào staging area" -ForegroundColor Green
}

Write-Host ""
$commitMessage = Read-Host "Nhập commit message (mặc định: Initial commit)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit: Snowman Ski Game"
}

$commit = Read-Host "Tạo commit? (y/n)"
if ($commit -eq "y" -or $commit -eq "Y") {
    git commit -m $commitMessage
    Write-Host "✓ Đã tạo commit" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bước Cuối Cùng" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Để push code lên GitHub, chạy lệnh sau:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  git branch -M main" -ForegroundColor White
Write-Host "  git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "Lưu ý:" -ForegroundColor Yellow
Write-Host "- Username: Nhập GitHub username của bạn" -ForegroundColor White
Write-Host "- Password: Dán Personal Access Token (PAT)" -ForegroundColor White
Write-Host ""
Write-Host "Nếu gặp lỗi, xem file HUONG_DAN_GITHUB.md để biết cách xử lý." -ForegroundColor Cyan
Write-Host ""

