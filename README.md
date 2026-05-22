# AnonChat - Complete Guide

Demo in https://anonchat-1y2.pages.dev/
A fully working, privacy-first anonymous chatting site.
(The demo's server can take some time to get up it sleeps when idle)
## What You Get

- **Web Server** (Electron + React): A good looking web application(in my opinion)
- **Signaling Server** (Node.js + Socket.io): Ephemeral
- **1:1 Calling** (WebRTC): Peer-to-peer voice and video
- **Text Chat**: Real time, in-memory ONLY messaging
- **Privacy First**: No accounts, no logs, delete everything once app is shutdown

## Quick Start (5 minutes)

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- Git
- Windows 10/11

### Step 1: Clone and Install

```powershell
cd c:\Users\YourUsername\Desktop
git clone https://github.com/hefe0935/AnonChat.git
cd AnonChat

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Start the Server

Open PowerShell in the `server` folder and run:

```powershell
npm start
```

The server is now listening for WebSocket connections.

### Step 3: Start the Client (Dev Mode)

Open PowerShell in the `client` folder and run:

```powershell
npm run dev
```

The Vite dev server starts. In another terminal in the same folder:

```powershell
npm run electron-dev
# Electron window opens with the app
```

### Step 4: Test the App

1. **Create a session**: Click " Create New Session"
2. **See your ephemeral code**: Share it (e.g., "1234")
3. **Open another window**: Then "Join Session" and enter the code
4. **Send messages**: Type in chat
5. **Start a call**: Click "Start Call" to initiate WebRTC call

## 📁 Project Structure

```
AnonChat/
├── client/                      # Electron + React app
│   ├── electron/
│   │   ├── main.js             # Privacy-protected main process
│   │   └── preload.js          # Safe IPC bridge
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.jsx      # Join/Create screen
│   │   │   ├── Chat.jsx         # Chat interface
│   │   │   └── CallScreen.jsx   # Video call interface
│   │   ├── utils/
│   │   │   ├── crypto.js        # Code generation, hashing
│   │   │   ├── RTCManager.js    # WebRTC peer connection
│   │   │   ├── SignalingClient.js # Socket.io client
│   │   │   └── storage.js       # Secure local storage
│   │   ├── App.jsx              # Main app component
│   │   └── index.css            # Tailwind styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                      # Node.js signaling server
│   ├── server.js               # Socket.io signaling logic
│   └── package.json
├── infra/                       # Infrastructure guides
│   └── COTURN_SETUP.md         # TURN server config
└── README.md
```

## 🔐 Privacy & Security Features

### Ephemeral IDs
- User IDs generated locally, discarded on close
- Room codes are 8-character alphanumeric, single-use
- Each session gets unique ID, never reused

### No Persistence
- Messages exist only in memory
- Auto-delete on disconnect
- Local storage cleared on app close
- Server stores nothing permanently

### Screen Capture Protection
- `BrowserWindow.setContentProtection(true)` enabled
- Context menu disabled
- Developer tools disabled
- PrintScreen, F12, F11 blocked
- Still ways to get photos or videos of course but harder for normal people

### Recording Prevention
- **No MediaRecorder** anywhere in code
- Streams never saved to disk
- No file export buttons
- Client sandboxed (no Node.js in renderer)

### Content Protection
- Minimal logging (dev only)
- Server discards logs in production
- Reports stored 7 days then deleted
- No personally identifiable information

## 📞 WebRTC Setup

### STUN (Works for Most Users)

By default, the app uses Google's public STUN servers:
```
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
```

### TURN (For NAT-Restricted Networks)

If STUN doesn't work (no connection, 1-way audio), you need to

1. **Host a TURN server** (see `infra/COTURN_SETUP.md`)
2. **Add credentials to client**:

```javascript
// In client/src/utils/RTCManager.js, modify this.iceServers:
this.iceServers = [
  { urls: ['stun:stun.l.google.com:19302'] },
  {
    urls: ['turn:your-turn-server.com:3478'],
    username: 'ephemeral-user',
    credential: 'ephemeral-credential',  // Expires in 24h
  },
];
```

3. Generate ephemeral credentials with:
```javascript
// Node.js
import crypto from 'crypto';
const username = `user_${Date.now()}`;
const hmac = crypto.createHmac('sha1', 'shared-secret')
  .update(username)
  .digest('base64');
```

## 🛠️ Building for Production

### Build Client (Windows Installer)

```powershell
cd client
npm run electron-builder
# Creates: dist/Anonymous Communication 1.0.0.exe
```

The installer is code-signed if you have certificates:

```powershell
# Set environment variables:
$env:CSC_LINK = 'C:\path\to\certificate.pfx'
$env:CSC_KEY_PASSWORD = 'your-password'
npm run electron-builder
```

### Deploy Server

#### Option A: VPS with Node.js

```bash
# On your VPS:
sudo apt-get update && sudo apt-get install nodejs npm
cd /opt/anonymous-comm
git clone https://github.com/your-repo.git
cd server
npm install --production
npm start
```

#### Option B: Using PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Start server with auto-restart
pm2 start server.js --name "anon-comm-signaling"
pm2 startup
pm2 save

# Monitor
pm2 logs anon-comm-signaling
```

#### Option C: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
docker build -t anon-comm-server .
docker run -p 5000:5000 anon-comm-server
```

### HTTPS/WSS Setup (Required for Production)

```bash
# Generate certificates with Let's Encrypt
sudo certbot certonly --standalone -d your-domain.com

# Modify server.js to use HTTPS:
import fs from 'fs';
import https from 'https';

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/fullchain.pem'),
};

const httpServer = https.createServer(options, app);

// Update client to use wss://
// In client App.jsx:
const signalingClient = new SignalingClient('wss://your-domain.com');
```

## Testing & QA

### Manual Tests

1. **Test PrintScreen Blocking**
   - Press PrintScreen key
   - App should not allow capture
   - Expected: Blocked by main process

2. **Test OBS/Screen Capture**
   - Open OBS Studio, add Window Capture
   - Select app window
   - Expected: Window is protected (may show black/protected content)

3. **Test Message Auto-Delete**
   - Send message, disconnect
   - Expected: Messages cleared from memory

4. **Test Room Code Single-Use**
   - Create room, note code
   - User1 joins with code
   - Create new room, note code
   - User2 tries old code
   - Expected: "Room not found"

5. **Test WebRTC Connection**
   - Start call without internet
   - Expected: After 10s timeout, "ICE connection failed"
   - With STUN: Connection succeeds
   - With TURN: Works even behind restrictive NAT

### Network Conditions

```powershell
# Windows: Use TMeter or NetLimiter for testing
# Simulate latency, packet loss, bandwidth limits
```

### Security Tests

```powershell
# Test 1: Check for MediaRecorder API
# Open DevTools
# Type: window.MediaRecorder
# Expected: ReferenceError (if sandboxed properly)

# Test 2: Check context isolation
# Type: window.require
# Expected: undefined (Node.js not available)

# Test 3: Check console logs
# In production build, no logs should appear
```

## 🐛 Troubleshooting

### "Failed to connect to server"
- **Solution**: Make sure server is running (`npm start` in `server/` folder)
- Check port 5000 is not blocked by firewall
- Try: `netstat -an | findstr :5000`

### "No sound/video in call"
- **Step 1**: Check browser permissions (Settings → Privacy → Microphone/Camera)
- **Step 2**: Use STUN+TURN: Add TURN server (see WebRTC Setup above)
- **Step 3**: Check firewall: Electron might need firewall rule
- **Step 4**: Test with another device on same network

### "One-way audio"
- **Cause**: NAT/firewall issue
- **Solution**: Add TURN server (see COTURN_SETUP.md)
- **Verify**: `navigator.mediaDevices.enumerateDevices()` shows audio/video

### "ICE connection failed"
- **Problem**: Can't reach other peer
- **Debug**: Check ICE candidates in browser console
- **Solution**: Add TURN server with different protocol (UDP/TCP/TLS)

### "Server crashes on connect"
- **Check logs**: `npm run dev` to see errors
- **Check ports**: Port 5000 already in use?
- **Check node**: Require Node 18+: `node --version`

### "App won't start (Electron)"
- **Step 1**: Clear Vite cache: `rm -r client/dist/`
- **Step 2**: Rebuild: `npm run build`
- **Step 3**: Check npm version: `npm --version` (6.0+)
- **Step 4**: Check logs: `npm run electron-dev 2>&1 | tee error.log`

## Logs & Monitoring

### Server Logs (Development)

```bash
npm run dev
# Outputs timestamped logs showing:
# - User connections/disconnections
# - Room creates/joins
# - Message relays (count only, not content)
# - ICE candidates
# - Reports submitted
```

### Production Logging

In production, logs are **silently discarded**. To re-enable:

```javascript
// In server.js, modify isDev check:
const isDev = true;  // Force logging
```

### Monitoring Endpoint

```bash
curl http://localhost:5000/stats
# Returns:
# {
#   "timestamp": "2024-11-14T...",
#   "rooms": 2,
#   "reports": 0,
#   "roomDetails": [...]
# }
```

## Performance Benchmarks

- **Signaling latency**: < 50ms (same network)
- **Room creation**: < 100ms
- **Video bitrate**: 500 kbps - 2.5 Mbps (changes)
- **Max participants**: 2 (1:1 calls only)
- **Memory per connection**: ~5-10 MB



## 🔮 Future Improvements

1. **End-to-End Encryption (E2EE)**
   - Use TweetNaCl.js for symmetric encryption
   - Exchange keys via ECDH

2. **Group Calls (Selective)**
   - Mesh topology for 3-4 people
   - SFU (Selective Forwarding Unit) for larger groups

3. **File Sharing** (encrypted, temporary)
   - In-memory transfer, auto-delete
   - Via DataChannel in WebRTC

4. **Mobile Clients**
   - React Native (iOS/Android)
   - Unified signaling server

5. **Screen Sharing**
   - getDisplayMedia() for peer-to-peer only
   - Timestamp watermark (proof of sharing)

6. **Moderation**
   - ML-based content filtering (on-device)
   - Report verification system

7. **TURN Credential Generation**
   - Auto-generate ephemeral creds from server
   - Rotate every 24 hours

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 💬 Support

For issues, questions, or privacy concerns:
- Open a GitHub issue

**Last Updated**: Early 2026 first made: Early 2025 
**Node Compatibility**: 18.0.0+
**Electron Version**: 27.0.0
**React Version**: 18.2.0
