import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class AdminSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided =
      request.header('x-admin-secret') ??
      request.header('X-Admin-Secret') ??
      '';

    const expected = this.configService.get<string>('ADMIN_SECRET') ?? '';

    if (!expected) {
      throw new UnauthorizedException(
        'ADMIN_SECRET is not configured on the server',
      );
    }

    if (!provided || !this.secretsMatch(provided, expected)) {
      throw new UnauthorizedException('Invalid admin secret');
    }

    return true;
  }

  private secretsMatch(provided: string, expected: string): boolean {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);

    if (a.length !== b.length) {
      return false;
    }

    return timingSafeEqual(a, b);
  }
}
