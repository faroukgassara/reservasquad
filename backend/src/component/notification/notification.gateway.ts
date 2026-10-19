import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, SOCKET_ROOMS } from 'src/common/constants/socket-events';
import { EStatus } from 'src/generated/prisma/client';
import { IJwtUserPayload } from 'src/interface/request/request.interface';
import { PrismaService } from 'src/prisma/prisma.service';

const STAFF_ROLES = new Set(['ADMIN', 'USER']);

function extractToken(client: Socket): string | null {
  const authToken = client.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken) return authToken.replace(/^Bearer\s+/i, '');
  const header = client.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class NotificationGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<IJwtUserPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.prismaService.user.findUnique({
        where: { id: payload.id },
        select: { id: true, role: true, status: true, tokenVersion: true, deletedAt: true },
      });
      if (
        !user ||
        user.deletedAt ||
        user.status !== EStatus.ACTIVE ||
        (payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)
      ) {
        client.disconnect(true);
        return;
      }

      await client.join(SOCKET_ROOMS.user(user.id));
      if (STAFF_ROLES.has(user.role)) await client.join(SOCKET_ROOMS.STAFF);
    } catch {
      client.disconnect(true);
    }
  }

  emitToUser(userId: string, payload: unknown) {
    if (!this.server) {
      this.logger.warn('Socket server not ready; notification not pushed');
      return;
    }
    this.server.to(SOCKET_ROOMS.user(userId)).emit(SOCKET_EVENTS.NOTIFICATION_NEW, payload);
  }
}
