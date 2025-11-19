import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { ChatStatus } from '../schemas/chat.schema';

export class StartChatDto {
  @IsString()
  @IsOptional()
  guestName?: string;

  @IsEmail()
  @IsOptional()
  guestEmail?: string;

  @IsString()
  initialMessage: string;
}

export class SendMessageDto {
  @IsString()
  roomId: string;

  @IsString()
  content: string;
}

export class AssignAgentDto {
  @IsMongoId()
  agentId: string;
}

export class UpdateChatStatusDto {
  @IsEnum(ChatStatus)
  status: ChatStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ChatQueryDto {
  @IsEnum(ChatStatus)
  @IsOptional()
  status?: ChatStatus;

  @IsMongoId()
  @IsOptional()
  agentId?: string;

  @IsMongoId()
  @IsOptional()
  userId?: string;
}