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
          'Invalid input: key, data, and exp_in are required',
        );
      }
      const redisRes = await this.redisClient.setex(key, exp_in, data);
      return { status: 1, redisRes };
    } catch (error) {
      console.error('Error in key-value Redis:', { key, data, exp_in, error });
      throw new ConflictException('Error occurred while saving data in Redis');
    }
  }

  async getValueByKey_withClearKey_value({ key }: { key: string }) {
    if (!key) {
      throw new ConflictException('Key must be provided');
    }
    try {
      const data = await this.redisClient.get(key);

      if (!data) {
        throw new NotFoundException(`No data found for key: ${key}`);
      }

      // OTP found, now delete it from Redis
      // await this.redisClient.del(key);
      return {
        status: 1,
        message: 'data retrieved and deleted successfully',
        data,
      };
    } catch (error) {
      console.error('Error for getting data form redis :', error);
      throw new InternalServerErrorException(
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
      // CAN MAKE A DB OPRATION HERE

      return {
        status: 'success',
        message: `Successfully pushed data to queue: ${key} , pushType : ${pushType}`,
      };
    } catch (error) {
      console.error('Error pushing data to Redis queue:', {
        key,
        data,
        pushType,
        error,
      });
      throw new InternalServerErrorException(
        'Failed to push data to Redis queue',
      );
    }
  }
}
