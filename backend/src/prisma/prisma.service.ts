import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma connected to database');
    } catch (err: any) {
      console.warn('⚠️  Prisma database connection warning:', err.message || err);
      console.warn('ℹ️  Ensure DATABASE_URL or Supabase pooler credentials are configured.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
