# 🎮 Snowman Ski Game

Một game trượt tuyết vui nhộn với người tuyết làm nhân vật chính. Tránh các chướng ngại vật, thu thập coins và stars, sử dụng power-ups để đạt điểm cao nhất!

## ✨ Tính Năng

- 🎮 Gameplay đơn giản nhưng hấp dẫn
- 🎨 Nhiều skins và themes để mua và sử dụng
- 🏆 Hệ thống thành tích và bảng xếp hạng
- 🛒 Cửa hàng để mua skins và themes bằng coins/stars
- 🎵 Nhạc nền và sound effects
- 📱 Hỗ trợ cả desktop và mobile
- ⭐ Hệ thống combo và level tăng dần độ khó

## 🎯 Cách Chơi

### Điều Khiển
- **Desktop**: Phím ← → hoặc A/D để di chuyển
- **Mobile**: Vuốt trái/phải hoặc dùng nút điều khiển
- **P/Esc**: Tạm dừng game

### Mục Tiêu
- ✓ Tránh chướng ngại vật (cây, đá, người tuyết)
- ✓ Thu thập coins 🪙 và stars ⭐ để tăng điểm
- ✓ Nhặt power-ups để có lợi thế
- ✓ Đạt điểm cao nhất!

### Power-ups
- 🛡️ **Shield**: Bảo vệ khỏi 1 va chạm
- ⚡ **Speed Boost**: Di chuyển nhanh hơn
- ⭐ **Score Multiplier**: Nhân đôi điểm số
- ⏱️ **Slow Motion**: Làm chậm thời gian
- 🧲 **Magnet**: Tự động hút collectibles

## 🚀 Cài Đặt và Chạy

1. Clone repository:
```bash
git clone https://github.com/YOUR_USERNAME/Game-nguoi-tuyet.git
cd Game-nguoi-tuyet
```

2. Mở file `index.html` trong trình duyệt web

Hoặc sử dụng local server:
```bash
# Sử dụng Python
python -m http.server 8000

# Sử dụng Node.js (nếu có http-server)
npx http-server
```

Sau đó truy cập `http://localhost:8000` trong trình duyệt.

## 📁 Cấu Trúc Dự Án

```
Game-nguoi-tuyet/
├── index.html          # Welcome screen
├── game.html           # Game screen
├── css/
│   ├── welcome.css    # Styles cho welcome screen
│   └── game.css       # Styles cho game screen
├── js/
│   ├── game.js        # Game logic chính
│   ├── welcome.js     # Welcome screen logic
│   ├── audio.js       # Audio manager
│   ├── shop.js        # Shop system
│   ├── collectibles.js # Collectibles manager
│   ├── powerups.js    # Power-ups manager
│   ├── achievements.js # Achievements manager
│   ├── leaderboard.js # Leaderboard manager
│   └── utils.js       # Utility functions
├── assets/
│   └── audio/         # Audio files
└── README.md          # File này
```

## 🛠️ Công Nghệ Sử Dụng

- HTML5 Canvas API
- Vanilla JavaScript (ES6+)
- CSS3 với animations
- LocalStorage cho persistence
- Web Audio API

## 📝 License

Dự án này là mã nguồn mở và có sẵn dưới [MIT License](LICENSE).

## 👨‍💻 Tác Giả

Tạo bởi [Tên của bạn]

## 🙏 Cảm Ơn

Cảm ơn bạn đã chơi game! Chúc bạn có thời gian vui vẻ! 🎄⛄
