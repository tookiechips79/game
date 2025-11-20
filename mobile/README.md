# 📱 GameBird Mobile App

React Native mobile app for GameBird betting platform using Expo.

**Status:** Independent project - does NOT modify web app code

---

## 🚀 Getting Started

### Prerequisites
```bash
# Install Node.js 18+ and npm
node --version
npm --version

# Install Expo CLI globally
npm install -g expo-cli
```

### Installation

```bash
cd mobile
npm install
```

### Running the App

**Start Expo development server:**
```bash
npm start
```

**Run on iOS simulator (macOS only):**
```bash
npm run ios
```

**Run on Android emulator:**
```bash
npm run android
```

**Run on web:**
```bash
npm run web
```

---

## 📂 Project Structure

```
mobile/
├── src/
│   ├── screens/              # App screens
│   │   ├── OnePocketArenaScreen.tsx
│   │   ├── GameHistoryScreen.tsx
│   │   ├── UserWalletScreen.tsx
│   │   ├── UserSettingsScreen.tsx
│   │   └── LoginScreen.tsx
│   ├── components/           # Reusable components
│   │   ├── BetCard.tsx
│   │   ├── ScoreBoard.tsx
│   │   └── GameControl.tsx
│   ├── contexts/             # React Context (shared logic)
│   │   ├── UserContext.tsx
│   │   └── GameStateContext.tsx
│   ├── services/             # API & Socket.IO
│   │   └── socketIOService.ts
│   ├── types/                # TypeScript types
│   │   └── user.ts
│   └── hooks/                # Custom hooks
│       └── useGameState.ts
├── assets/                   # Images & icons
├── App.tsx                   # Main app component
├── app.json                  # Expo configuration
└── package.json              # Dependencies

```

---

## 🔌 Backend Connection

The mobile app connects to the **same backend** as the web app:

- **Development:** `http://localhost:3001`
- **Production:** Same domain as deployed backend

### Socket.IO Events (Same as Web)
- `set-arena` - Join betting arena
- `new-game-added` - New game recorded
- `game-history-update` - Real-time history sync
- `bet-update` - Betting queue changes
- `user-joined` - User connected

---

## 📱 Features

### Implemented
- ✅ User authentication (login/signup)
- ✅ One Pocket Arena betting interface
- ✅ Real-time game history
- ✅ User wallet & credits
- ✅ Socket.IO real-time sync
- ✅ Bottom tab navigation

### In Progress
- 🔄 Push notifications
- 🔄 Offline bet queueing
- 🔄 Dark mode optimization

### TODO
- ⚪ Admin controls
- ⚪ Payment integration
- ⚪ Statistics dashboard

---

## 🎨 Styling

Mobile app uses:
- **React Native Paper** - Material Design components
- **React Native StyleSheet** - Native styling
- **Custom theme** - Dark mode by default

---

## 🔐 Environment Variables

Create `.env` in the mobile directory:

```env
BACKEND_URL=http://localhost:3001
API_KEY=your_api_key
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `expo` | React Native framework |
| `react-native` | Native framework |
| `react-native-paper` | Material Design UI |
| `react-navigation` | Navigation library |
| `socket.io-client` | Real-time communication |

---

## 🚨 Important: Web App Untouched

**The mobile app is completely independent:**
- ✅ Separate directory (`/mobile`)
- ✅ Separate dependencies (`mobile/package.json`)
- ✅ Separate configs (`app.json`, `app.tsx`)
- ✅ Web app code unchanged
- ✅ Same backend (shared)

**To work on web app:**
```bash
cd ..  # Go back to root
npm run dev  # Web app runs normally
```

**To work on mobile app:**
```bash
cd mobile
npm start  # Mobile app runs
```

---

## 🔄 Updating App

### When web code changes
Mobile doesn't care - it only connects to the backend API

### When backend changes
Update `socketIOService` in `src/services/`

---

## 📝 Next Steps

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start development:**
   ```bash
   npm start
   ```

3. **Choose platform:**
   - Press `i` for iOS
   - Press `a` for Android
   - Press `w` for web

4. **Scan QR code** with Expo Go app (or use simulator)

---

## ⚠️ Common Issues

### App won't connect to backend
- Ensure backend is running: `bash START_SERVER.sh`
- Check backend URL in socket connection
- Verify network connectivity

### Dependencies fail to install
```bash
rm -rf node_modules package-lock.json
npm install
```

### Socket.IO connection issues
- Clear cache: `expo start --clear`
- Check firewall settings
- Verify backend is accessible

---

## 📞 Support

For issues, check:
1. Backend is running and accessible
2. Node.js/npm versions match (18+)
3. .env file configured correctly
4. Network connectivity

---

**Last Updated:** November 19, 2025  
**Status:** Development Ready ✅

