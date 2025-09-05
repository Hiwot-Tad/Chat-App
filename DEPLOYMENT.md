# Chat App Backend - Deployment Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Environment variables configured

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/chat_app_db"

# JWT Secret (Generate a strong random string for production)
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"

# Application URL (for invite links and CORS)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Database Setup

1. Create a PostgreSQL database
2. Update the DATABASE_URL in your environment file
3. Run database migrations:

```bash
npx prisma generate
npx prisma db push
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## API Endpoints

The backend provides the following API endpoints:

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

## File Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── layout.tsx     # Root layout
│   └── favicon.ico    # App icon
├── lib/
│   ├── auth.ts        # Authentication utilities
│   ├── middleware.ts  # API middleware
│   ├── prisma.ts      # Database client
│   └── socket.ts      # Socket.IO configuration
public/
├── uploads/           # File uploads directory
│   ├── avatars/       # User avatars
│   └── messages/      # Message media
prisma/
└── schema.prisma      # Database schema
```

## Security Notes

- Always use HTTPS in production
- Set strong JWT secrets
- Configure proper CORS settings
- Validate all input data
- Use environment variables for sensitive data

## Deployment Platforms

### Vercel
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Railway
1. Connect your repository
2. Set environment variables
3. Deploy with one click

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Monitoring

- Monitor API response times
- Set up error tracking (Sentry, etc.)
- Monitor database performance
- Track file upload usage

## Backup

- Regular database backups
- Backup uploaded files
- Version control for code
