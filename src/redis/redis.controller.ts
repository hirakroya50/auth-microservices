import { Body, Controller, Get, Post } from '@nestjs/common';
import { RedisService } from './redis.service';
import { LpushBodyDto } from './dto/redis-queue-lpush.dto';
import { ConfigService } from '@nestjs/config';

@Controller('redis')
export class RedisController {
  constructor(
    private readonly redisService: RedisService,

    private readonly configService: ConfigService,
  ) {}

  @Post('lpush-pub-sub')
  async dummyOperation(@Body() lpushBody: LpushBodyDto) {
    const data = JSON.stringify(lpushBody);
    const key = this.configService.get<string>(
      'REDIS_PUB_SUB_QUEUE_KEY',
      'sub',
    );
    const pushType = 'lpush';
    return this.redisService.pushToRedisQueue({ data, key, pushType });
  }
}
