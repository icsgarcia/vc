# 🎥 Video Call Application

A modern, real-time video calling application with messaging built with React, TypeScript, Node.js, Socket.IO, and WebRTC.

## ✨ Features

-   🎥 **1-to-1 Video Calling** - High-quality peer-to-peer video calls
-   🎤 **Audio Control** - Mute/unmute microphone
-   📹 **Camera Control** - Turn camera on/off
-   💬 **Real-time Chat** - Send messages during calls
-   ⚙️ **Device Selection** - Choose camera, microphone, and speaker
-   📱 **Responsive Design** - Works on mobile, tablet, and desktop
-   🎨 **Modern UI** - Beautiful gradient design with smooth animations

## 🚀 Quick Start

### Prerequisites

-   Node.js 18+ and npm
-   Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**

    ```bash
    git clone <your-repo-url>
    cd vc
    ```

2. **Install server dependencies**

    ```bash
    cd server
    npm install
    cp .env.example .env
    ```

3. **Install client dependencies**
    ```bash
    cd ../client
    npm install
    cp .env.example .env
    ```

### Running Locally

1. **Start the server**

    ```bash
    cd server
    npm run dev
    ```

    Server runs on `http://localhost:3000`

2. **Start the client** (in a new terminal)

    ```bash
    cd client
    npm run dev
    ```

    Client runs on `http://localhost:5173`

3. **Open your browser**
    - Visit `http://localhost:5173`
    - Enter your name
    - Choose a room
    - Open another browser window/tab to test with a second user

## 📁 Project Structure

```
vc/
├── client/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── socket.ts      # Socket.IO client config
│   │   └── webrtc.ts      # WebRTC utilities
│   ├── .env              # Environment variables
│   └── package.json
│
└── server/                # Node.js + Express backend
    ├── index.js          # Main server file
    ├── .env             # Environment variables
    └── package.json
```

## 🔧 Configuration

### Client Environment Variables

Create `client/.env`:

```env
VITE_NODE_ENV=development
VITE_API_URL=http://localhost:3000

# Optional TURN server for better connectivity
VITE_TURN_SERVER_URL=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

### Server Environment Variables

Create `server/.env`:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:

-   Environment configuration
-   TURN server setup
-   Deployment to Vercel, Netlify, Railway, etc.
-   Production checklist

## 🛠️ Tech Stack

### Frontend

-   **React 18** - UI framework
-   **TypeScript** - Type safety
-   **Vite** - Build tool
-   **TailwindCSS** - Styling
-   **Socket.IO Client** - Real-time communication
-   **WebRTC** - Peer-to-peer video/audio

### Backend

-   **Node.js** - Runtime
-   **Express** - Web framework
-   **Socket.IO** - WebSocket server
-   **CORS** - Cross-origin support

## 📖 How It Works

1. **User joins a room** - Client connects to Socket.IO server
2. **Audio stream initialized** - Microphone access requested (camera off by default)
3. **WebRTC handshake** - Peers exchange offer/answer via Socket.IO signaling
4. **ICE candidates exchanged** - NAT traversal using STUN/TURN servers
5. **Peer connection established** - Direct P2P audio/video stream
6. **Real-time messaging** - Chat messages sent via Socket.IO

## 🎯 Current Limitations

-   **1-to-1 calls only** - Currently supports two participants per room
-   **No persistence** - Chat history not saved
-   **No authentication** - Anyone can join any room
-   **Basic STUN only** - May have connectivity issues behind strict firewalls (add TURN for production)

## 🔮 Future Improvements

-   [ ] Multiple participants support
-   [ ] Screen sharing
-   [ ] Recording functionality
-   [ ] User authentication
-   [ ] Room passwords
-   [ ] Chat history persistence
-   [ ] Virtual backgrounds
-   [ ] Better mobile support
-   [ ] Connection quality indicators
-   [ ] Waiting room feature

## 🐛 Troubleshooting

### Camera/Microphone not working

-   Check browser permissions
-   Ensure HTTPS (required for getUserMedia in production)
-   Try different browser

### Connection issues

-   Check if both users are on the same network
-   For production, add TURN server credentials
-   Check firewall settings

### "Failed to connect to server"

-   Verify backend is running
-   Check CORS settings
-   Verify `VITE_API_URL` in client `.env`

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

---

Made with ❤️ using React, WebRTC, and Socket.IO
