# Socket Connection Test Guide

## Issue Fixed

The token was being retrieved incorrectly from localStorage using raw `localStorage.getItem()` instead of the `Localstorage.get()` utility that handles JSON parsing.

## What Was Changed

### 1. Client - notification.jsx

- ✅ Changed from `localStorage.getItem("accessToken")` to `Localstorage.get("accessToken")`
- ✅ Added `Localstorage` import from utils
- ✅ Added null check before connecting socket

### 2. Client - socket.js

- ✅ Added better logging to show token preview
- ✅ Added `registered` event listener to confirm success
- ✅ Better error messages with emojis

### 3. Server - socket.js

- ✅ Added detailed token debugging logs
- ✅ Shows token type and preview
- ✅ Shows specific JWT error messages

## How to Test

### Step 1: Check if you're logged in

Open browser console and run:

```javascript
// Check if token exists
const token = JSON.parse(localStorage.getItem("accessToken"));
console.log("Token:", token);

// Check if user exists
const user = JSON.parse(localStorage.getItem("user"));
console.log("User:", user);
```

If both are null, you need to login first!

### Step 2: Test socket connection

1. Navigate to `/notification` page
2. Open browser console
3. You should see:
   ```
   🔑 Token for socket (first 20 chars): eyJhbGciOiJIUzI1NiIs...
   ✅ Socket connected: xyz123
   📤 Emitting 'register' event with token
   ✅ Successfully registered with server: {userId: "...", socketId: "..."}
   ```

### Step 3: Check server logs

In your Docker container or server terminal, you should see:

```
🔌 User connected: xyz123
📝 Registering user with token
📦 Token type: string
🔑 Token (first 30 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6...
✅ User authenticated: 507f1f77bcf86cd799439011
```

## Common Issues & Solutions

### Issue 1: "No token provided"

**Symptom:** Console shows "❌ No token provided"
**Solution:** You're not logged in. Go to `/login` and login first.

### Issue 2: "Invalid token"

**Symptom:** Server logs show "❌ Invalid token" with error details
**Possible causes:**

- Token expired → Logout and login again
- Wrong secret key → Check `ACCESS_TOKEN_SECRET` in server .env
- Token malformed → Clear localStorage and login again

**Quick fix:**

```javascript
// In browser console
localStorage.clear();
// Then login again
```

### Issue 3: "Server disconnected"

**Symptom:** Client shows "io server disconnect"
**Solution:** This means server rejected your token. Follow Issue 2 solution.

### Issue 4: CORS error

**Symptom:** Console shows CORS policy error
**Solution:**

1. Restart nginx: `docker compose restart nginx`
2. Check VITE_SOCKET_URL in client/.env is `http://localhost:3000`
3. Check CORS_ORIGIN in server/.env is `http://localhost:5173`

## Testing Token Validity

Run this in browser console:

```javascript
const token = JSON.parse(localStorage.getItem("accessToken"));
if (token) {
  // Decode JWT (doesn't verify, just shows content)
  const parts = token.split(".");
  const payload = JSON.parse(atob(parts[1]));
  console.log("Token payload:", payload);
  console.log("Expires:", new Date(payload.exp * 1000));
  console.log("Is expired:", Date.now() > payload.exp * 1000);
}
```

## Restart Everything

If still having issues, restart all services:

```bash
# Server
cd server
docker compose down
docker compose up --build

# Client (in new terminal)
cd client
npm run dev
```

Then:

1. Clear browser localStorage
2. Login fresh
3. Navigate to /notification
4. Check console for socket connection logs
