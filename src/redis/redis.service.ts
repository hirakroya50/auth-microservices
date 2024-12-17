import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import Redis from 'ioredis';
import { Create_key_valueDto } from './dto/create-key-value.dto';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private redisClient: Redis) {}

  async saveKeyValueInRedis({ key, exp_in, data }: Create_key_valueDto) {
    try {
      // input vlidattion
      if (!key || !data || exp_in <= 0) {
        throw new ConflictException(
          'Invalid input: in redis key-value sam=ve in redis',
        );
      }
      const redisRes = await this.redisClient.setex(key, exp_in, data);
      return { status: 1, redisRes };
    } catch (error) {
      console.error('Eror in key-value Redis:', error);
      throw new ConflictException('Error occurred while saving data in Redis');
    }
  }

  async getValueByKey_withClearKey_value({ key }: { key: string }) {
    try {
      const data = await this.redisClient.get(key);

      if (data) {
        // OTP found, now delete it from Redis
        // await this.redisClient.del(key);
        return {
          status: 1,
          message: 'data retrieved and deleted successfully',
          data,
        };
      }
    } catch (error) {
      console.error('Erro for gettign data form redis :', error);
      throw new ConflictException(
        'Error occurred while retrieving data from Redis',
      );
    }
  }

  async pushToRedisQueue({
    key,
    data,
    pushType,
  }: {
    key: string;
    data: string;
    pushType: 'lpush';
  }) {
    try {
      if (!key || !data) {
        throw new ConflictException('Key and data must be provided');
      }

      if (pushType === 'lpush') {
        await this.redisClient.lpush(key, data);
      } else {
        await this.redisClient.rpush(key, data);
      }

      return {
        status: 'success',
        message: `Successfully pushed data to queue: ${key}`,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to push data to Redis queue',
      );
    }
  }
}
