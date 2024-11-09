import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';
import { RedisModule } from './redis/redis.module';
import { SmsModule } from './sms/sms.module';
import { SmsService } from './sms/sms.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000, // Time-to-live in seconds
        limit: 10, // Maximum number of requests within the ttl period
      },
    ]),
    AuthModule,
    PrismaModule,
    EmailModule,
    RedisModule,
    SmsModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService, PrismaService, EmailService, SmsService],
})
export class AppModule {}
