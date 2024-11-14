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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn:
            configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '60m',
        },
      }),
    }),
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
  providers: [
    AppService,
    AuthService,
    PrismaService,
    EmailService,
    SmsService,
    JwtService,
    JwtStrategy,
    JwtAuthGuard,
  ],
})
export class AppModule {}
