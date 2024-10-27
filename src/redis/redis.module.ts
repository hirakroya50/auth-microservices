import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import Redis from 'ioredis';

@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const client = new Redis({
          host: 'localhost',
          port: 6379,
        });
        return client;
      },
    },
  ],
  controllers: [RedisController],
  exports: [RedisService, 'REDIS_CLIENT'],
})
export class RedisModule {}
