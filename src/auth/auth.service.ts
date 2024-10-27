import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GenerateOtpDto } from './dto/genarate-otp.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

import { EmailService } from 'src/email/email.service';
import Redis from 'ioredis';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private redisService: RedisService,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  async generateOtp({ generateOtpDto }: { generateOtpDto: GenerateOtpDto }) {
    //check the user email is already exist or not
    const user = await this.prisma.user.findUnique({
      where: { email: generateOtpDto.email },
    });

    if (user) {
      throw new ConflictException('email exist');
    }

    //genarate a random otp,
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the OTP in Redis with a 15-minute expiration
    const redis = await this.redisService.saveKeyValueInRedis({
      key: generateOtpDto.email,
      exp_in: 15 * 60, // for 15m
      data: otp,
    });

    // send the otp (will valid for 15m )
    // const emial = await this.emailService.sendEmail({
    //   to: generateOtpDto.email,
    //   html: ` <body style="font-family: system-ui, math, sans-serif">
    //   <div>
    //     Hotel Booking page , OTP MAIL
    //     <br />
    //       <h1>YOUR OTP IS :${otp}</h1>
    //       <h4>This otp is valid for 15m </h4>
    //   </div>
    // </body>`,
    //   subject: 'Hotel Booking page , OTP MAIL',
    //   text: 'otp send ',
    // });

    //take the email
    //SAVE THE OTP WITH THE EMAIL IN THE REDIS STORE NO IN DB
    // that email send function will sed the work in a
    //  messegeque that will handel the email send process
    // then send the response
    return { status: 1, otp, redis };
  }

  async getSignUpOtp() {
    try {
      const email = '1royhirakp@gmail.com';
      const otpFrom_redis =
        await this.redisService.getValueByKey_withClearKey_value({
          key: email,
        });
      return {
        otpFrom_redis,
      };
    } catch (error) {
      return {
        error,
        msg: 'error is comig form here',
      };
    }
  }
  //GET ALL THE USER
  async getAll() {
    try {
      const allUser = await this.prisma.user.findMany();
      return { allUser };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  //DELETE THE "MY EMAIL" JUST FOR TESTING
  async deleteUser() {
    try {
      const deleteUser = await this.prisma.user.delete({
        where: {
          email: 'royhirakp@gmail.com',
        },
      });
      return { deleteUser, message: 'User successfully deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma error code for "Record to delete does not exist"
        throw new NotFoundException('User with the specified email not found');
      }
      throw new ConflictException('Error occurred while deleting user');
    }
  }
}
