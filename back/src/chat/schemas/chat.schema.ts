import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MessageSender {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system',
}

export enum ChatStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Schema()
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender?: Types.ObjectId;

  @Prop({ required: true, enum: MessageSender })
  senderType: MessageSender;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: false })
  isRead: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

@Schema({ timestamps: true })
export class Chat extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  @Prop()
  guestName?: string;

  @Prop()
  guestEmail?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedAgent?: Types.ObjectId;

  @Prop({ type: [MessageSchema], default: [] })
  messages: Message[];

  @Prop({ required: true, enum: ChatStatus, default: ChatStatus.ACTIVE })
  status: ChatStatus;

  @Prop()
  roomId: string; // ID único de la sala

  @Prop()
  lastMessageAt?: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// Índices
ChatSchema.index({ roomId: 1 });
ChatSchema.index({ user: 1 });
ChatSchema.index({ assignedAgent: 1 });
ChatSchema.index({ status: 1 });
ChatSchema.index({ lastMessageAt: -1 });