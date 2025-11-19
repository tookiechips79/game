# PostgreSQL Database Setup Guide

## Quick Start - 3 Options

### Option 1: Use Render PostgreSQL (Recommended - Easiest)
**Status:** ✅ Already integrated in your code  
**Cost:** Free tier available  
**Setup time:** 2-3 minutes

1. Go to https://render.com
2. Sign up (free)
3. Create → PostgreSQL
4. Name it: `gamebird-db`
5. Copy the "External Database URL"
6. See "Setup Instructions" section below

### Option 2: Use Heroku PostgreSQL
**Status:** ✅ Should work with your code  
**Cost:** Free tier removed (was free before 2022)  
**Setup time:** 2-3 minutes

1. Go to https://heroku.com
2. Create app
3. Add PostgreSQL add-on
4. Copy DATABASE_URL
5. See "Setup Instructions" section below

### Option 3: Local PostgreSQL (Mac)
**Status:** ⚠️ Requires manual installation  
**Cost:** Free  
**Setup time:** 5-10 minutes

```bash
# If you haven't already:
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb gamebird

# Create user with password
createuser gamebird_user -P
# Enter password: gamebird_password (or your choice)

# Grant privileges
psql gamebird << EOF
GRANT ALL PRIVILEGES ON DATABASE gamebird TO gamebird_user;
EOF

# DATABASE_URL will be:
# postgresql://gamebird_user:gamebird_password@localhost:5432/gamebird
```

---

## Setup Instructions (All Options)

### Step 1: Get Your DATABASE_URL

After creating PostgreSQL (using any option above), you'll have a connection string that looks like:

```
postgresql://user:password@host:port/database
```

**Example from Render:**
```
postgresql://gamebird_user:ABC123xyz@pg-xxx.render.com:5432/gamebird_db
```

### Step 2: Create `.env` File

In your project root (`/Users/randallpaguio/Desktop/MAIN!!!!!!!!/`), create `.env`:

```bash
DATABASE_URL=postgresql://your_user:your_password@your_host:your_port/your_database
```

Replace with your actual values.

### Step 3: Start Server

```bash
cd /Users/randallpaguio/Desktop/MAIN!!!!!!!!/
node server.js
```

### Step 4: Verify It Works

You should see in the logs:

```
✅ [SERVER] Initializing PostgreSQL database...
✅ [DB] Users table ready
✅ [DB] Credits table ready
✅ [DB] Game History table ready
✅ [DB] Database initialization complete
✅ [DATABASE] Ready for operations
```

---

## Test It Works

1. **In browser**, add a game via the UI
2. **Refresh the page** - game should still be there ✅
3. **Check console:**
   ```
   💰 [GAME-HISTORY-SYNC] Received real-time game history update
   ✅ [GAME-HISTORY-SYNC] Updated from socket: 0 → 1 games
   ```

---

## Recommended: Use Render (Easiest)

Here's the fastest path:

1. Go to https://render.com (free account)
2. Click "New +" → "PostgreSQL"
3. Name: `gamebird-db`
4. Region: Choose closest to you
5. Click "Create Database"
6. Wait 2-3 minutes for creation
7. Copy "External Database URL" (button on right side)
8. Create `.env` in your project with that URL
9. Restart server with `node server.js`
10. ✅ Done!

---

## Troubleshooting

### "Cannot find module 'pg'"
```bash
npm install pg
```

### "DATABASE_URL not set"
```bash
# Check .env exists and has DATABASE_URL
cat .env | grep DATABASE_URL

# If using local shell, export it:
export DATABASE_URL="postgresql://..."
```

### "Connection refused"
- Check DATABASE_URL is correct
- Check PostgreSQL is running
- Check host/port are accessible

### "Table already exists"
This is normal! Server checks "IF NOT EXISTS" before creating.

---

## Files Ready to Use

Your codebase already has everything:
- ✅ `server.js` - Socket.IO handlers set up
- ✅ `src/db/database.js` - Database module ready
- ✅ `src/contexts/UserContext.tsx` - Game history listeners configured
- ✅ `package.json` - `pg` package included

Just need the DATABASE_URL!

