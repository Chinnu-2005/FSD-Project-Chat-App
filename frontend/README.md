# ChatApp Frontend

A modern React.js frontend for the real-time chat application.

## Features

- 🔐 JWT Authentication (Login/Register)
- 💬 Real-time Private Messaging
- 🧑🤝🧑 Group Chats
- 👥 User Search & Connection Requests
- ⚡ Socket.IO Integration
- 📱 Responsive Dark Theme UI
- 🔔 Typing Indicators
- ✅ Read Receipts
- 📎 File Upload Support

## Tech Stack

- React.js 18 with Hooks
- React Router for navigation
- Axios for HTTP requests
- Socket.IO Client for real-time features
- Custom CSS (Dark Theme)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Auth/          # Login & Register
│   ├── Chat/          # Sidebar & ChatWindow
│   └── Common/        # Shared components
├── pages/             # Main pages
├── utils/             # API & Socket utilities
└── index.css          # Global styles
```

## API Integration

The frontend integrates with the backend API endpoints:

- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/chats/*` - Private messaging
- `/api/groups/*` - Group chats
- `/api/upload/*` - File uploads

## Socket Events

Real-time features using Socket.IO:

- Private/Group messaging
- Typing indicators
- Online/Offline presence
- Read receipts
- Room management