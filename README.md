# Yap Social Media App

A full-stack social media application with real-time messaging, post sharing, toxicity detection, and community features.

## 📱 Features

- **User Authentication** - Secure registration and login with JWT
- **Posts & Media** - Share images and videos with the community
- **Comments** - Engage with posts through comments
- **Real-time Messaging** - Chat with other users using WebSocket
- **Follow System** - Follow/unfollow users and build your network
- **Toxicity Detection** - AI-powered content moderation using Python (Simple one)
- **User Profiles** - Customizable profiles with profile pictures
- **Community Feed** - Discover and interact with community posts

## 🛠️ Tech Stack

### Backend

- **Node.js** & **Express.js** - Server framework
- **MongoDB** with **Mongoose** - Database
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **Python** - Toxicity detection service
- **bcryptjs** - Password hashing

### Frontend

- **React Native** with **Expo** - Mobile app framework
- **Expo Router** - File-based routing
- **NativeWind** (Tailwind CSS) - Styling
- **Axios** - API requests
- **Socket.io Client** - Real-time updates
- **React Native Gesture Handler** - Gesture support
- **Bottom Sheet** - UI components

## 📁 Project Structure

```
yap-socialmedia-app/
├── backend/              # Node.js/Express backend
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth & upload middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── uploads/         # Uploaded media files
│   ├── utils/           # Utility functions
│   └── app.js           # Main server file
│
├── frontend/            # React Native/Expo frontend
│   ├── app/            # Expo Router pages
│   │   ├── (auth)/     # Authentication screens
│   │   └── (tabs)/     # Main tab screens
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API services
│   └── utils/          # Utility functions
│
└── models/             # Shared models
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3.x
- MongoDB (local or cloud instance)
- npm or yarn
- Expo CLI (for mobile app)

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yap-social-media
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Start the backend server:

```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Update API configuration in `services/api.js` if needed

4. Start the Expo development server:

```bash
npm start
```

5. Run on your preferred platform:

```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

### 📱 Running on a Physical Device

To run the app on your physical phone:

1. **Install Expo Go App**

   - Download and install [Expo Go](https://expo.dev/client) from the App Store (iOS) or Play Store (Android)

2. **Connect to Same Network**

   - Ensure your phone and development machine are connected to the **same WiFi network**
   - Note: If mobile data did not work - use WiFi for both devices

3. **Update Network Configuration**

   - After running `npm start` in the frontend directory, look for the QR code in the terminal
   - Below the QR code, you'll see a URL like: `exp://192.168.1.xxx:8081`
   - Copy the IP address (e.g., `192.168.1.5`) **without the last 4 port digits**
   - Open `frontend/utils/networkConfig.js` and update the IP address:

4. **Scan QR Code**
   - Open Expo Go app on your phone
   - Scan the QR code from the terminal
   - The app will load on your device

**Troubleshooting:**

- If the app doesn't connect, verify both devices are on the same WiFi network
- Disable VPN if active on either device
- Check your firewall settings to ensure ports 5000 and 8081 are not blocked

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Posts

- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/comment` - Add comment to post
- `POST /api/posts/:id/like` - Like/unlike post

### Users

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

### Follow

- `POST /api/follow/:userId` - Follow/unfollow user
- `GET /api/follow/:userId/followers` - Get user's followers
- `GET /api/follow/:userId/following` - Get users being followed

### Messages

- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/:conversationId` - Get messages in conversation
- `POST /api/messages` - Send new message

## 🔒 Environment Variables

### Backend

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Frontend

Update the API base URL in `frontend/services/api.js` based on your backend configuration.

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
```

## 📝 Python Toxicity Detection

The application includes a Python-based toxicity detection system for content moderation. The CLI tool can be run using:

```bash
cd backend
python check_toxicity_cli.py
```
