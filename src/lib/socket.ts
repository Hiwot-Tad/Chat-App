import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from './auth';
import { prisma } from './prisma';

export interface SocketData {
  userId: string;
  email: string;
}

export interface ServerToClientEvents {
  message: (data: {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string | null;
    media_url: string | null;
    message_type: string;
    created_at: Date;
    sender: {
      id: number;
      name: string;
      avatar_url: string | null;
    };
  }) => void;
  typing: (data: { userId: number; conversationId: number; isTyping: boolean }) => void;
  messageStatus: (data: { messageId: number; userId: number; status: string }) => void;
  userOnline: (data: { userId: number; isOnline: boolean }) => void;
  conversationUpdate: (data: { conversationId: number; type: string }) => void;
}

export interface ClientToServerEvents {
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  typing: (data: { conversationId: number; isTyping: boolean }) => void;
  messageStatus: (data: { messageId: number; conversationId: number; status: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
      >;
    };
  };
};

export const initSocket = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const payload = verifyToken(token);
        socket.data.userId = payload.userId;
        socket.data.email = payload.email;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    io.on('connection', async (socket) => {
      const userId = parseInt(socket.data.userId);

      // Update user online status
      await prisma.user.update({
        where: { id: userId },
        data: { last_seen: new Date() }
      });

      // Join user to their conversations
      const userConversations = await prisma.conversationMember.findMany({
        where: { user_id: userId }
      });

      userConversations.forEach((conv: { conversation_id: number }) => {
        socket.join(`conversation_${conv.conversation_id}`);
      });

      // Handle joining conversations
      socket.on('joinConversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
      });

      // Handle leaving conversations
      socket.on('leaveConversation', (conversationId) => {
        socket.leave(`conversation_${conversationId}`);
      });

      // Handle typing indicators
      socket.on('typing', async (data) => {
        socket.to(`conversation_${data.conversationId}`).emit('typing', {
          userId,
          conversationId: data.conversationId,
          isTyping: data.isTyping
        });
      });

      // Handle message status updates
      socket.on('messageStatus', async (data) => {
        try {
          await prisma.messageStatus.update({
            where: {
              message_id_user_id: {
                message_id: data.messageId,
                user_id: userId
              }
            },
            data: {
              status: data.status,
              updated_at: new Date()
            }
          });

          // Emit status update to conversation
          socket.to(`conversation_${data.conversationId}`).emit('messageStatus', {
            messageId: data.messageId,
            userId,
            status: data.status
          });
        } catch (error) {
          console.error('Error updating message status:', error);
        }
      });

      socket.on('disconnect', async () => {
        // Update user offline status
        await prisma.user.update({
          where: { id: userId },
          data: { last_seen: new Date() }
        });

        // Emit user offline status to all conversations
        userConversations.forEach((conv: { conversation_id: number }) => {
          socket.to(`conversation_${conv.conversation_id}`).emit('userOnline', {
            userId,
            isOnline: false
          });
        });
      });
    });

    res.socket.server.io = io;
  }

  return res.socket.server.io;
};

export const getSocketIO = (res: NextApiResponseServerIO) => {
  return res.socket.server.io;
};
