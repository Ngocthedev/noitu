# 🎮 Discord Bot Nối Từ Việt Nam

Bot Discord mini-game nối từ tiếng Việt với đầy đủ tính năng quản lý và thống kê.

## ✨ Tính năng chính

### 🎯 Game Play
- **Nối từ 2 từ**: Chỉ chấp nhận cụm từ có đúng 2 từ
- **Luật nối từ**: Từ đầu của cụm mới = từ cuối của cụm trước
- **Chống spam**: Người chơi không thể nối chính mình
- **Từ láy/lặp**: Chấp nhận các từ như "lung linh", "xanh xanh"
- **Auto restart**: Tự động bắt đầu ván mới khi bế tắc

### 💡 Hệ thống trợ giúp
- **Gợi ý từ**: `/help` để nhận gợi ý từ hợp lệ
- **Giới hạn hàng ngày**: 5 lượt trợ giúp/ngày (có thể tùy chỉnh)
- **Reset tự động**: Làm mới lượt trợ giúp vào 00:00 (giờ VN)
- **Kiểm tra trợ giúp**: `/checkhelp` để xem lượt còn lại

### 🔧 Quản lý Owner
- **Thiết lập kênh**: `/setnoitu` chọn kênh chơi
- **Tùy chỉnh trợ giúp**: `/setmaxhelp`, `/givehelp`
- **Quản lý game**: `/resethistory`, `/forcenew`
- **Cài đặt**: `/togglewords`, `/setcooldown`
- **Thống kê**: `/stats` xem báo cáo chi tiết

## 🚀 Cài đặt và chạy

### 1. Yêu cầu hệ thống
- Node.js 16.9.0 trở lên
- Discord Bot Token

### 2. Tạo Discord Bot
1. Vào [Discord Developer Portal](https://discord.com/developers/applications)
2. Tạo New Application
3. Vào Bot tab, tạo bot và copy Token
4. Trong OAuth2 > URL Generator:
   - Scopes: `bot`
   - Bot Permissions: `Send Messages`, `Read Message History`, `Add Reactions`

### 3. Cài đặt dự án
```bash
# Clone hoặc tải dự án
# Cài đặt dependencies
npm install

# Tạo file .env từ .env.example
cp .env.example .env
```

### 4. Cấu hình
Chỉnh sửa file `.env`:
```env
DISCORD_TOKEN=your_discord_bot_token_here
OWNER_IDS=your_discord_user_id_here
```

### 5. Chạy bot
```bash
npm start
```

## 📚 Từ điển

Bot đọc từ điển từ thư mục `tudien/`. File mẫu `vietdict.txt` đã được cung cấp với hơn 100 cụm từ.

### Thêm từ vào từ điển:
1. Mở file `tudien/vietdict.txt`
2. Thêm các cụm từ mới, mỗi cụm một dòng
3. Chỉ các cụm có đúng 2 từ mới được bot sử dụng
4. Restart bot để tải lại từ điển

## 🎮 Hướng dẫn chơi

### Lệnh người chơi:
- `/help` - Nhận gợi ý từ hợp lệ (5 lần/ngày)
- `/checkhelp` - Kiểm tra số lượt trợ giúp còn lại

### Lệnh Owner:
- `/setnoitu channel:#kênh` - Thiết lập kênh chơi
- `/setmaxhelp <số>` - Đặt giới hạn trợ giúp/ngày
- `/givehelp @user <số>` - Tặng thêm lượt trợ giúp
- `/resethistory` - Xóa lịch sử từ đã dùng
- `/forcenew` - Bắt đầu ván mới ngay lập tức
- `/togglewords on/off` - Bật/tắt kiểm tra trùng lặp
- `/setcooldown <giây>` - Đặt thời gian chờ giữa lượt
- `/stats` - Xem thống kê chi tiết

### Cách chơi:
1. Owner sử dụng `/setnoitu` để chọn kênh
2. Bot tự động bắt đầu với một cụm từ 2 từ
3. Người chơi nhập cụm từ 2 từ để nối tiếp
4. Từ đầu của cụm mới phải = từ cuối của cụm trước
5. Bot phản ứng ✅ nếu hợp lệ, ❌ nếu sai
6. Khi bế tắc, bot tự động bắt đầu ván mới

## 🏗️ Kiến trúc

Dự án được thiết kế theo các nguyên tắc SOLID:

```
src/
├── bot.js                    # Entry point và setup chính
├── commands/
│   ├── player-commands.js    # Lệnh cho người chơi
│   └── owner-commands.js     # Lệnh cho owner
├── services/
│   ├── dictionary-service.js # Quản lý từ điển
│   ├── game-service.js       # Logic game
│   ├── help-service.js       # Hệ thống trợ giúp
│   └── stats-service.js      # Thống kê
├── utils/
│   └── message-validator.js  # Validation input
└── data/                     # Dữ liệu bot (tự tạo)
```

## 🤝 Đóng góp

1. Fork dự án
2. Tạo branch tính năng (`git checkout -b feature/amazing-feature`)
3. Commit thay đổi (`git commit -m 'Add amazing feature'`)
4. Push lên branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🎯 Tác giả

Được tạo bởi Bolt AI với yêu cầu từ người dùng Việt Nam 🇻🇳

---

**Chúc bạn chơi vui vẻ! 🎉**