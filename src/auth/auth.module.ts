import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailModule } from 'src/email/email.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [PrismaModule, EmailModule, RedisModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
