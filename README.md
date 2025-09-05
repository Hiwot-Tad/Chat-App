# Chat App Backend

A comprehensive backend API for a real-time chat application built with Next.js, Prisma, and Socket.IO.

## 🚀 Features

- **Authentication** - JWT-based user authentication and authorization
- **Real-time Messaging** - Socket.IO integration for live chat
- **File Upload** - Support for avatars and media files
- **Group Chats** - Create and manage group conversations with roles
- **Message Management** - Send, edit, delete, forward, and react to messages
- **Contact System** - Add, block, and manage contacts
- **Search** - Search through users and messages
- **Polls** - Create and vote on polls in conversations
- **Message Status** - Track message delivery and read status
- **Invite System** - Generate invite links for group conversations

## 🛠️ Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/chat_app_db"
   JWT_SECRET="your-super-secret-jwt-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Add contact
- `PUT /api/contacts` - Update/block contact
- `DELETE /api/contacts` - Remove contact

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `POST /api/conversations/[id]/leave` - Leave conversation
- `GET /api/conversations/[id]/members` - List members
- `POST /api/conversations/[id]/members` - Add member
- `PUT /api/conversations/[id]/members` - Update member role
- `DELETE /api/conversations/[id]/members` - Remove member

### Messages
- `GET /api/conversations/[id]/messages` - List messages
- `POST /api/conversations/[id]/messages` - Send message
- `PUT /api/conversations/[id]/messages/[msgId]` - Edit message
- `DELETE /api/conversations/[id]/messages/[msgId]` - Delete message
- `POST /api/conversations/[id]/messages/[msgId]` - Forward message

### File Uploads
- `POST /api/upload/avatar` - Upload avatar
- `DELETE /api/upload/avatar` - Delete avatar
- `POST /api/upload/media` - Upload media files

### Real-time Communication
- WebSocket endpoint: `/api/socketio`

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:
- **Users** - User accounts and profiles
- **Conversations** - Chat conversations (direct and group)
- **Messages** - Chat messages with media support
- **Contacts** - User contact relationships
- **Polls** - Voting polls in conversations
- **File Uploads** - Avatar and media file management

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- File upload security
- CORS protection
- Role-based access control

## 🚀 Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Deploy to platforms:**
   - Vercel (recommended for Next.js)
   - Railway
   - AWS
   - DigitalOcean
   - Heroku

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── conversations/     # Conversation management
│   │   ├── messages/          # Message handling
│   │   ├── upload/            # File upload endpoints
│   │   └── users/             # User management
│   └── layout.tsx             # Root layout
├── lib/
│   ├── auth.ts                # Authentication utilities
│   ├── middleware.ts          # API middleware
│   ├── prisma.ts              # Database client
│   └── socket.ts              # Socket.IO configuration
public/
└── uploads/                   # File upload directory
    ├── avatars/               # User avatars
    └── messages/              # Message media
prisma/
└── schema.prisma              # Database schema
```

## 🧪 Testing

Use the provided Postman collection (`Chat_App_Complete_API.postman_collection.json`) to test all API endpoints.

## 📚 Documentation

- See `DEPLOYMENT.md` for detailed deployment instructions
- See `UPLOAD_SETUP.md` for file upload configuration

## 🎯 Ready for Production

Your chat app backend is now ready for deployment! 

**Key features:**
- ✅ Complete API with authentication
- ✅ Real-time messaging with Socket.IO
- ✅ File upload support
- ✅ Database schema with Prisma
- ✅ Production-ready configuration
- ✅ Comprehensive error handling
- ✅ Security best practices

Deploy and start building your frontend! 🚀