# Chat Application Backend

A comprehensive backend for a real-time chat application built with Next.js, Prisma, PostgreSQL, and Socket.IO.

## Features

### 🔐 Authentication & User Management
- User registration and login with JWT tokens
- Password hashing with bcrypt
- User profile management (name, avatar, bio, status)
- Online/offline status tracking

### 💬 Messaging System
- Direct messaging between users
- Group chat creation and management
- Real-time messaging with Socket.IO
- Message types: text, image, video, file, audio, sticker, GIF
- **Message editing, deletion, and forwarding**
- Reply and quote specific messages
- Message delivery and read receipts

### 👥 Contact Management
- Add and remove contacts
- Block and unblock users
- Contact list management

### 🔍 Search & Organization
- Advanced search with filters (sender, conversation, date, message type)
- Message pagination
- **Pin important messages within chats**
- **Message reactions with emojis**
- **Star messages for later reference**
- **Saved messages (personal storage)**
- **Bulk message operations** (delete, forward multiple messages)

### 📱 Real-time Features
- Live typing indicators
- Online status updates
- Instant message delivery
- Real-time notifications

### 🏗️ Group Management
- **Add and remove group members**
- **Change member roles (member, admin, owner)**
- **Leave or delete groups**
- **Ownership transfer when owner leaves**
- **Group invite links** (shareable codes with expiration)
- **Polls system** (create polls, vote, change votes)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.IO
- **Language**: TypeScript
- **Validation**: Built-in request validation

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chat-app-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations (if you have them)
   npx prisma migrate dev
   
   # Or if you want to use your existing database schema
   npx prisma db pull
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Conversations
- `GET /api/conversations` - List user conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/[id]/messages` - Get conversation messages
- `POST /api/conversations/[id]/messages` - Send message
- `GET /api/conversations/[id]/pinned-messages` - Get pinned messages
- `POST /api/conversations/[id]/pinned-messages` - Pin a message
- `DELETE /api/conversations/[id]/pinned-messages` - Unpin a message
- `GET /api/conversations/[id]/invites` - Get group invites
- `POST /api/conversations/[id]/invites` - Create invite link
- `DELETE /api/conversations/[id]/invites` - Revoke invite
- `GET /api/conversations/[id]/polls` - Get conversation polls
- `POST /api/conversations/[id]/polls` - Create poll
- `POST /api/polls/[id]/vote` - Vote on poll
- `PUT /api/polls/[id]/vote` - Change vote
- `DELETE /api/polls/[id]/vote` - Remove vote
- `GET /api/conversations/[id]/members` - Get conversation members
- `POST /api/conversations/[id]/members` - Add member to group
- `PUT /api/conversations/[id]/members` - Update member role
- `DELETE /api/conversations/[id]/members` - Remove member from group
- `POST /api/conversations/[id]/leave` - Leave or delete conversation

### Messages
- `PUT /api/conversations/[id]/messages/[messageId]` - Edit message
- `DELETE /api/conversations/[id]/messages/[messageId]` - Delete message
- `POST /api/conversations/[id]/messages/[messageId]` - Forward message
- `GET /api/messages/[messageId]/reactions` - Get message reactions
- `POST /api/messages/[messageId]/reactions` - Add reaction to message
- `DELETE /api/messages/[messageId]/reactions` - Remove reaction from message
- `POST /api/messages/[messageId]/star` - Star a message
- `DELETE /api/messages/[messageId]/star` - Unstar a message

### Contacts
- `GET /api/contacts` - List user contacts
- `POST /api/contacts` - Add new contact
- `PUT /api/contacts` - Update contact (block/unblock)

### Saved Messages
- `GET /api/saved-messages` - Get saved messages
- `POST /api/saved-messages` - Save a message

### Invites
- `POST /api/invites/[inviteCode]/join` - Join group using invite code

### Bulk Operations
- `DELETE /api/conversations/[id]/messages/bulk` - Bulk delete messages
- `POST /api/conversations/[id]/messages/bulk` - Bulk forward messages
- `DELETE /api/contacts` - Remove contact

### Search
- `GET /api/search?q=query&type=all` - Search users and messages

### WebSocket
- `/api/socketio` - Socket.IO endpoint for real-time communication

## Database Schema

The application uses the following main tables:

- **users** - User accounts and profiles
- **conversations** - Chat conversations (direct and group)
- **conversation_members** - Conversation participants with roles
- **messages** - Chat messages with edit/delete support
- **message_status** - Message delivery and read status
- **message_reactions** - Emoji reactions on messages
- **pinned_messages** - Pinned messages in conversations
- **contacts** - User contact relationships

## Real-time Communication

The backend uses Socket.IO for real-time features:

- **Message Broadcasting**: Messages are instantly delivered to all conversation participants
- **Typing Indicators**: Shows when users are typing
- **Online Status**: Real-time user online/offline status
- **Message Status**: Live updates for message delivery and read receipts
- **Message Reactions**: Real-time emoji reactions
- **Group Updates**: Live member changes and role updates

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Request validation and sanitization
- Protected API routes
- User authorization checks
- Role-based access control for group management

## Development

### Running Tests
```bash
npm run test
```

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db reset

# Generate Prisma client after schema changes
npx prisma generate
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   - Use a strong JWT_SECRET
   - Configure production DATABASE_URL
   - Set NODE_ENV=production

3. **Start the production server**
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
