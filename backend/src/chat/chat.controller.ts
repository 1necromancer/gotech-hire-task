import { Controller, Get, Post, Body, Param, Headers, UnauthorizedException, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthService } from '../auth/auth.service';
import { CreateRoomDto } from '../dto/create-room.dto';

@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private authService: AuthService,
  ) {}

  @Get('rooms')
  async getRooms() {
    return this.chatService.getRooms();
  }

  @Post('rooms')
  async createRoom(@Body() dto: CreateRoomDto, @Headers('authorization') auth: string) {
    if (!auth) {
      throw new UnauthorizedException('Token required');
    }
    const token = auth.replace('Bearer ', '');
    const decoded = this.authService.verifyToken(token);
    if (!decoded) {
      throw new UnauthorizedException('Invalid token');
    }
    return this.chatService.createRoom(dto.name, dto.description);
  }

  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.chatService.getMessages(roomId, limit, offset);
  }
}
