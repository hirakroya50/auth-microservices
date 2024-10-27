import {
  ConflictException,
  Inject,
  Injectable,
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
      const otp = await this.redisClient.get(key);
      if (!otp) {
        return new NotFoundException(`No value found for key: ${key}`);
      }
      if (otp) {
        // OTP found, now delete it from Redis
        await this.redisClient.del(key);
        return {
          status: 1,
          message: 'OTP retrieved and deleted successfully',
          otp,
        };
      }
    } catch (error) {
      console.error('Erro for gettign data form redis :', error);
      throw new ConflictException(
        'Error occurred while retrieving data from Redis',
      );
    }
  }
}
