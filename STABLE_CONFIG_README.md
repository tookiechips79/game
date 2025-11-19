# ✅ STABLE CONFIGURATION - DO NOT CHANGE

**Status:** All systems working as intended. Game history is persistent and syncing in real-time.

---

## 🚀 How to Start the Server

Always use this command:
```bash
bash /Users/randallpaguio/Desktop/MAIN\!\!\!\!\!\!\!\!/START_SERVER.sh
```

This script:
1. Loads the `.env` file (which contains DATABASE_URL)
2. Starts Node.js with PostgreSQL enabled
3. Initializes all database tables
4. Connects to Render.com PostgreSQL

---

## 📌 Critical Files (DO NOT DELETE)

| File | Purpose |
|------|---------|
| `.env` | Contains PostgreSQL connection string (Render.com) |
| `START_SERVER.sh` | Server startup script that loads .env |
| `server.js` | Backend with Socket.IO handlers |
| `src/contexts/UserContext.tsx` | Game history state management |

---

## ✨ What's Working

- ✅ **Game History Persistence**: Games saved to PostgreSQL database
- ✅ **Real-time Sync**: All clients see updates instantly via Socket.IO
- ✅ **Page Refresh**: Game history survives browser refreshes
- ✅ **Multiple Clients**: Data syncs across all connected browsers
- ✅ **Admin Controls**: Team A/Team B win buttons record games
- ✅ **Zero Delay**: Removed 100ms delay for instant updates
- ✅ **Debug Logging**: Comprehensive console logs for troubleshooting

---

## 🔧 Server Port

```
http://localhost:3001
```

---

## 📊 Database

**Provider:** Render.com PostgreSQL  
**URL:** In `.env` file (DO NOT SHARE THIS)  
**Tables:** 
- users
- credits
- transactions
- game_history

---

## ⚠️ If Something Breaks

1. **Game history not showing?**
   - Stop server: `Ctrl+C` or `kill <PID>`
   - Restart: `bash START_SERVER.sh`
   - Verify `.env` file has DATABASE_URL

2. **Server won't start?**
   - Check `.env` file exists
   - Verify DATABASE_URL is set
   - Check port 3001 is not in use: `lsof -i :3001`

3. **Data not persisting?**
   - Server restarted? Use START_SERVER.sh
   - DATABASE_URL lost? Create new one on Render.com

---

## 🎯 DO NOT

- ❌ Delete `.env` file
- ❌ Delete `START_SERVER.sh`
- ❌ Change database connection string without telling me
- ❌ Modify Socket.IO event handlers
- ❌ Change game history state management
- ❌ Start server with `node server.js` directly (use START_SERVER.sh)

---

## 📝 Logged Commits

All working changes are saved in git:
```
git log --oneline | head -5
```

Latest commit: "STABLE: Final working game history sync with PostgreSQL persistence"

---

**Last Verified:** November 19, 2025  
**Status:** ✅ PRODUCTION READY

