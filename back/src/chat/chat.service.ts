import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatStatus, MessageSender } from './schemas/chat.schema';
import { StartChatDto, ChatQueryDto } from './dto/chat.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
  ) {}

  async startChat(startChatDto: StartChatDto, userId?: string): Promise<Chat> {
    const roomId = uuidv4();

    const chat = new this.chatModel({
      user: userId,
      guestName: startChatDto.guestName,
      guestEmail: startChatDto.guestEmail,
      roomId,
      status: ChatStatus.ACTIVE,
      messages: [
        {
          sender: userId,
          senderType: MessageSender.USER, // SIEMPRE es USER cuando inicia el chat
          content: startChatDto.initialMessage,
          timestamp: new Date(),
          isRead: false,
        },
      ],
      lastMessageAt: new Date(),
    });

    return chat.save();
  }

  async sendMessage(
    roomId: string,
    content: string,
    userId?: string,
  ): Promise<any> {
    const chat = await this.chatModel.findOne({ roomId });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.status === ChatStatus.CLOSED) {
      throw new BadRequestException('Cannot send messages to closed chat');
    }

    // Determinar si es el paciente o un agente
    const isPatient = chat.user && chat.user.toString() === userId;
    
    const message = {
      sender: userId,
      senderType: isPatient ? MessageSender.USER : MessageSender.AGENT,
      content,
      timestamp: new Date(),
      isRead: false,
    };

    chat.messages.push(message as any);
    chat.lastMessageAt = new Date();

    await chat.save();

    return message;
  }

  async assignAgent(roomId: string, agentId: string): Promise<Chat> {
    const chat = await this.chatModel.findOne({ roomId });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    chat.assignedAgent = agentId as any;
    
    // Mensaje del sistema
    chat.messages.push({
      senderType: MessageSender.SYSTEM,
      content: 'Un agente se ha unido al chat',
      timestamp: new Date(),
      isRead: true, // Los mensajes del sistema ya están leídos
    } as any);

    return chat.save();
  }

  async findAll(query: ChatQueryDto): Promise<Chat[]> {
    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.agentId) {
      filter.assignedAgent = query.agentId;
    }

    if (query.userId) {
      filter.user = query.userId;
    }

    return this.chatModel
      .find(filter)
      .populate('user', 'firstName lastName email')
      .populate('assignedAgent', 'firstName lastName')
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async findOne(roomId: string): Promise<Chat> {
    const chat = await this.chatModel
      .findOne({ roomId })
      .populate('user', 'firstName lastName email')
      .populate('assignedAgent', 'firstName lastName')
      .exec();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  async updateStatus(
    roomId: string,
    status: ChatStatus,
    userId: string,
  ): Promise<Chat> {
    const chat = await this.chatModel.findOne({ roomId });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    chat.status = status;

    if (status === ChatStatus.RESOLVED || status === ChatStatus.CLOSED) {
      chat.resolvedAt = new Date();
      chat.resolvedBy = userId as any;
      
      chat.messages.push({
        senderType: MessageSender.SYSTEM,
        content: `Chat ${status === ChatStatus.RESOLVED ? 'resuelto' : 'cerrado'}`,
        timestamp: new Date(),
        isRead: true,
      } as any);
    }

    return chat.save();
  }

  // CORREGIDO: Solo marca como leídos los mensajes del USUARIO
  async markMessagesAsReadByAgent(roomId: string): Promise<void> {
    const chat = await this.chatModel.findOne({ roomId });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Solo marcar como leídos los mensajes del USUARIO (no del agente)
    chat.messages.forEach((msg) => {
      if (msg.senderType === MessageSender.USER && !msg.isRead) {
        msg.isRead = true;
      }
    });

    await chat.save();
  }

  // Para cuando el paciente lee mensajes del agente
  async markMessagesAsReadByUser(roomId: string): Promise<void> {
    const chat = await this.chatModel.findOne({ roomId });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Solo marcar como leídos los mensajes del AGENTE
    chat.messages.forEach((msg) => {
      if (msg.senderType === MessageSender.AGENT && !msg.isRead) {
        msg.isRead = true;
      }
    });

    await chat.save();
  }

  async getActiveChats(): Promise<Chat[]> {
    return this.chatModel
      .find({ status: ChatStatus.ACTIVE })
      .populate('user', 'firstName lastName email')
      .populate('assignedAgent', 'firstName lastName')
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async getChatHistory(userId: string): Promise<Chat[]> {
    return this.chatModel
      .find({ user: userId })
      .populate('assignedAgent', 'firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }
}