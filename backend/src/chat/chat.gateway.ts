import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthService } from '../auth/auth.service';

const ROOM_PREFIX = 'room_';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string;
    if (!token) {
      this.logger.warn(`Client ${client.id} disconnected: no token`);
      client.disconnect();
      return;
    }
    const decoded = this.authService.verifyToken(token);
    if (!decoded) {
      this.logger.warn(`Client ${client.id} disconnected: invalid token`);
      client.disconnect();
      return;
    }
    client.data.userId = decoded.userId;
    client.data.username = decoded.username;
    this.logger.log(`Client ${client.id} connected (user: ${decoded.username})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: { roomId: number }, @ConnectedSocket() client: Socket) {
    client.join(`${ROOM_PREFIX}${data.roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: { roomId: number; content: string }, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    const username = client.data.username;

    if (!userId) {
      return;
    }

    const message = await this.chatService.saveMessage(data.roomId, userId, data.content, username);

    this.server.to(`${ROOM_PREFIX}${data.roomId}`).emit('newMessage', {
      ...message,
      username,
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() data: { roomId: number }, @ConnectedSocket() client: Socket) {
    client.leave(`${ROOM_PREFIX}${data.roomId}`);
  }
}
