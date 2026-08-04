import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { IsString, MinLength } from 'class-validator';

class VerifySecretDto {
  @IsString()
  @MinLength(1)
  secret!: string;
}

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly configService: ConfigService) {}

  /** Check admin secret without exposing it. Used by admin unlock screen. */
  @Post('verify-secret')
  @HttpCode(200)
  verify(@Body() body: VerifySecretDto) {
    const expected = this.configService.get<string>('ADMIN_SECRET') ?? '';

    if (!expected || !this.secretsMatch(body.secret, expected)) {
      throw new UnauthorizedException('Invalid admin secret');
    }

    return { ok: true };
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
