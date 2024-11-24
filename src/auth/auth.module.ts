import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailModule } from 'src/email/email.module';
import { RedisModule } from 'src/redis/redis.module';
import { SmsService } from 'src/sms/sms.service';
import { SmsModule } from 'src/sms/sms.module';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './guards/roles.guard';
import { APP_GUARD, Reflector } from '@nestjs/core';

@Module({
  imports: [PrismaModule, EmailModule, RedisModule, SmsModule, JwtModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    RolesGuard,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [RolesGuard],
})
export class AuthModule {}
