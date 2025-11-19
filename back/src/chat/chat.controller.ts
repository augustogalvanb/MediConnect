import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatQueryDto, UpdateChatStatusDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ChatStatus } from './schemas/chat.schema';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Query() query: ChatQueryDto) {
    return this.chatService.findAll(query);
  }

  @Get('active')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getActiveChats() {
    return this.chatService.getActiveChats();
  }

  @Get('my-chats')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  getMyChatHistory(@GetUser() user: any) {
    return this.chatService.getChatHistory(user.userId);
  }

  @Get(':roomId')
  findOne(@Param('roomId') roomId: string) {
    return this.chatService.findOne(roomId);
  }

  @Patch(':roomId/status')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  updateStatus(
    @Param('roomId') roomId: string,
    @Body() updateChatStatusDto: UpdateChatStatusDto,
    @GetUser() user: any,
  ) {
    return this.chatService.updateStatus(
      roomId,
      updateChatStatusDto.status,
      user.userId,
    );
  }

  @Post(':roomId/assign/:agentId')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  assignAgent(
    @Param('roomId') roomId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.chatService.assignAgent(roomId, agentId);
  }

  // NUEVO: Endpoint para marcar mensajes como leídos
  @Post(':roomId/mark-read')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async markAsRead(
    @Param('roomId') roomId: string,
    @GetUser() user: any,
  ) {
    await this.chatService.markMessagesAsReadByAgent(roomId);
    return { success: true };
  }
}