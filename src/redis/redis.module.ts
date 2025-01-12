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
        const client = new Redis(process.env.REDIS_URL);
        return client;
      },
    },
  ],
  controllers: [RedisController],
  exports: [RedisService, 'REDIS_CLIENT'],
})
export class RedisModule {}
