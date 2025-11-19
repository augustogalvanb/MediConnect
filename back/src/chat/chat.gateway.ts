import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto, StartChatDto } from './dto/chat.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.onlineUsers.delete(client.id);
  }

  @SubscribeMessage('startChat')
  async handleStartChat(
    @MessageBody() startChatDto: StartChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const chat = await this.chatService.startChat(
        startChatDto,
        client.handshake.auth?.userId,
      );

      // Unir al cliente a la sala
      client.join(chat.roomId);

      // Notificar a los agentes disponibles
      this.server.to('agents').emit('newChat', {
        chatId: chat._id,
        roomId: chat.roomId,
        user: chat.user || chat.guestName,
        message: startChatDto.initialMessage,
      });

      return {
        success: true,
        chat: {
          id: chat._id,
          roomId: chat.roomId,
          status: chat.status,
        },
      };
    } catch (error) {
      this.logger.error('Error starting chat:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; userId?: string; isAgent?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      client.join(data.roomId);

      if (data.isAgent) {
        client.join('agents');
      }

      if (data.userId) {
        this.onlineUsers.set(client.id, data.userId);
      }

      this.logger.log(`Client ${client.id} joined room: ${data.roomId}`);

      return { success: true };
    } catch (error) {
      this.logger.error('Error joining room:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() sendMessageDto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.auth?.userId;
      const message = await this.chatService.sendMessage(
        sendMessageDto.roomId,
        sendMessageDto.content,
        userId,
      );

      // Enviar mensaje a todos en la sala
      this.server.to(sendMessageDto.roomId).emit('newMessage', {
        roomId: sendMessageDto.roomId,
        message: {
          sender: message.sender,
          senderType: message.senderType,
          content: message.content,
          timestamp: message.timestamp,
        },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('assignAgent')
  async handleAssignAgent(
    @MessageBody() data: { roomId: string; agentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.chatService.assignAgent(data.roomId, data.agentId);

      // Notificar al agente
      this.server.to(data.roomId).emit('agentAssigned', {
        roomId: data.roomId,
        agentId: data.agentId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error assigning agent:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('userTyping', {
      roomId: data.roomId,
      isTyping: data.isTyping,
      userId: client.handshake.auth?.userId,
    });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { roomId: string; isAgent?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Determinar si es agente o usuario y llamar al método correspondiente
      if (data.isAgent) {
        await this.chatService.markMessagesAsReadByAgent(data.roomId);
      } else {
        await this.chatService.markMessagesAsReadByUser(data.roomId);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Método para notificar desde otros servicios
  notifyNewAppointment(userId: string, appointment: any) {
    this.server.to(`user:${userId}`).emit('newAppointment', appointment);
  }

  notifyAppointmentReminder(userId: string, appointment: any) {
    this.server.to(`user:${userId}`).emit('appointmentReminder', appointment);
  }
}