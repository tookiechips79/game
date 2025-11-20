# 📱 GameBird Mobile App - Quick Setup Guide

## ✅ Complete! Your Mobile App is Ready

The mobile app has been created as a **completely independent project** that doesn't affect your web app at all.

---

## 📂 Project Location

```
/Users/randallpaguio/Desktop/MAIN!!!!!!!!/mobile/
```

---

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
cd /Users/randallpaguio/Desktop/MAIN\!\!\!\!\!\!\!\!/mobile
npm install
```

**Note:** If you get npm permission errors, use:
```bash
npm install --legacy-peer-deps
```

### Step 2: Start the Development Server

```bash
npm start
```

This will show a QR code and options to run on iOS, Android, or web.

### Step 3: Run on Your Device/Emulator

**For iOS (macOS only):**
```bash
npm run ios
```

**For Android:**
```bash
npm run android
```

**For Web Browser:**
```bash
npm run web
```

---

## 📋 What's Already Built

✅ **Complete Project Structure:**
- 5 screen components (Login, Arena, History, Wallet, Settings)
- User Context for state management
- Game State Context for game data
- Socket.IO service (connects to your backend)
- Complete navigation setup

✅ **Ready to Connect:**
- Socket.IO events configured
- Backend connection ready
- Real-time sync capabilities

---

## 🔌 Backend Connection

The mobile app automatically connects to your **same backend**:
- **Local:** `http://localhost:3001`
- **Production:** Same domain as your web app

**Make sure your backend is running:**
```bash
bash START_SERVER.sh
```

---

## 🎨 Architecture

```
mobile/
├── App.tsx                 # Main app with navigation
├── app.json               # Expo configuration
├── package.json           # Dependencies (SEPARATE from web)
├── src/
│   ├── screens/           # 5 screens (Login, Arena, History, Wallet, Settings)
│   ├── contexts/          # UserContext, GameStateContext
│   ├── services/          # socketIOService (connects to backend)
│   ├── types/             # TypeScript definitions
│   └── hooks/             # Custom React hooks
└── assets/                # Images & icons (placeholder)
```

---

## ✅ Web App NOT Affected

Your web app is **100% untouched**:

**To work on web app:**
```bash
cd /Users/randallpaguio/Desktop/MAIN\!\!\!\!\!\!\!\!
npm run dev
```

**To work on mobile app:**
```bash
cd /Users/randallpaguio/Desktop/MAIN\!\!\!\!\!\!\!\!/mobile
npm start
```

---

## 🔄 Shared Backend

**Both web and mobile connect to the same backend:**

```
┌──────────────────────────────────┐
│     Backend (Node.js)            │
│  ✅ Running on port 3001        │
│  ✅ PostgreSQL Database          │
└──────────────────────────────────┘
         ↗️            ↖️
    /mobile         /web
  React Native      React
  (iOS/Android)   (Browser)
```

Real-time sync via Socket.IO means:
- Game history updates instantly
- Betting queues sync live
- User credits updated across both apps

---

## 📱 Next Steps

1. **Run the mobile app:**
   ```bash
   npm start
   ```

2. **Choose platform:**
   - Press `i` for iOS
   - Press `a` for Android
   - Press `w` for web browser

3. **Login:** Use any username/password (mock auth for now)

4. **Explore:** Try the betting arena, game history, wallet

---

## 🚨 Troubleshooting

### "Cannot find module 'expo'"
```bash
npm install
```

### "Socket.IO connection failed"
- Ensure backend is running: `bash START_SERVER.sh`
- Check localhost:3001 is accessible
- On device, use IP address instead of localhost

### "Expo not found"
```bash
npm install -g expo-cli
npm install
npm start
```

### App freezes on load
- Check if backend is running
- Clear cache: `npm start --clear`
- Restart emulator

---

## 📝 Important Notes

1. **This mobile app is completely separate** - no web code was changed
2. **Both apps share the same backend** - real-time sync works
3. **Authentication is mocked for now** - you can enhance it later
4. **Socket.IO is fully configured** - ready for real-time features

---

## 🎯 What to Build Next

- [ ] Implement real login (connect to backend auth)
- [ ] Add push notifications
- [ ] Implement offline bet queueing
- [ ] Add admin controls
- [ ] Payment integration
- [ ] Stats dashboard

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| **Start mobile app** | `npm start` |
| **Run on iOS** | `npm run ios` |
| **Run on Android** | `npm run android` |
| **Run on web** | `npm run web` |
| **Install deps** | `npm install` |
| **Clear cache** | `npm start --clear` |

---

**Status:** ✅ Mobile app ready to build out!

**Last Updated:** November 19, 2025

