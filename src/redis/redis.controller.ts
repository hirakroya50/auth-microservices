import { Body, Controller, Get, Post } from '@nestjs/common';
import { RedisService } from './redis.service';
import { LpushBodyDto } from './dto/redis-queue-lpush.dto';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Post('lpush-redis')
  async dummyOperation(@Body() lpushBody: LpushBodyDto) {
    const data = JSON.stringify(lpushBody);
    const key = 'sub';
    const pushType = 'lpush';
    return this.redisService.pushToRedisQueue({ data, key, pushType });
  }
}
