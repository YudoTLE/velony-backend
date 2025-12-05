import { UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { CreateMessageRequestDto } from 'src/messages/dto/create-message-request.dto';
import { DeleteMessageRequestDto } from 'src/messages/dto/delete-message-request.dto';
import { UpdateMessageRequestDto } from 'src/messages/dto/update-message-request.dto';
import { MessagesService } from 'src/messages/messages.service';

import { WsJwtGuard } from './guards/ws-jwt.guard';

@WebSocketGateway({
  namespace: 'ws',
  cors: { origin: '*' },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @WebSocketServer()
  server: Server;

  private extractTokenFromCookie(cookieHeader: string): string | null {
    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        // eslint-disable-next-line security/detect-object-injection
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return cookies['access_token'] || null;
  }

  async handleConnection(client: Socket) {
    // console.log('[WS] Connection attempt started');
    // console.log('[WS] Headers:', client.handshake.headers);

    try {
      const cookies = client.handshake.headers.cookie;
      // console.log('[WS] Cookies:', cookies);

      if (!cookies) {
        // console.log('[WS] No cookies found - disconnecting');
        client.disconnect();
        return;
      }

      const token = this.extractTokenFromCookie(cookies);
      // console.log('[WS] Token extracted:', token ? 'YES' : 'NO');

      if (!token) {
        // console.log('[WS] No token found - disconnecting');
        client.disconnect();
        return;
      }

      // console.log('[WS] Verifying JWT...');
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });
      // console.log('[WS] JWT verified:', payload);

      client.data.user = {
        sub: payload.sub,
      };

      client.join(client.data.user.sub);
      // console.log('[WS] Connected:', client.data.user.sub);
    } catch (error) {
      // console.error('[WS] Authentication failed:', error.message);
      // console.error('[WS] Full error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // console.log('[WS] Disconnected:', client.data.user?.sub);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message.send')
  async handleMessageSend(
    @MessageBody() dto: CreateMessageRequestDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.messagesService.createOne(client.data.user.sub, dto);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message.edit')
  async handleMessageEdit(
    @MessageBody() dto: UpdateMessageRequestDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.messagesService.updateOne(client.data.user.sub, dto);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message.delete')
  async handleMessageDelete(
    @MessageBody() dto: DeleteMessageRequestDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.messagesService.deleteOne(client.data.user.sub, dto);
  }
}
