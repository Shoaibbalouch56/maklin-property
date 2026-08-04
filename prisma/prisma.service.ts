import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static hasLoggedConnection = false;

  async onModuleInit() {
    await this.$connect();
    if (!PrismaService.hasLoggedConnection) {
      PrismaService.hasLoggedConnection = true;
      console.log('Database connected');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
