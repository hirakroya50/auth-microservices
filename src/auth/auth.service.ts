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
import * as bcrypt from 'bcryptjs';
import { SignUpDto } from './dto/signup.dto';
import { EmailVerification_byOtpDto } from './dto/email-otp-varification.dto';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private redisService: RedisService,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  // Signup steps => get the user first data : "email",, "password" username , DOB, others , mob no(optonal )
  // => save the data and create the account
  // then on the next page give a option to varify the email
  // without varify the email user can login to the app .
  // but without varify the email user only and see the analiics , data and other tigs .
  // without varify the email user can get the total acces

  async signUp(signUpData: SignUpDto) {
    // const { email, otp, password, username, other user details } = signUpData;
    try {
    } catch (error) {
      return {
        error,
        msg: 'error for signup',
      };
    }
  }
  async generateOtp(generateOtpDto: GenerateOtpDto) {
    //check the user email is already exist or not
    const user = await this.prisma.user.findUnique({
      where: { email: generateOtpDto.email },
    });

    if (user) {
      throw new ConflictException('email exist');
    }

    try {
      //genarate a random otp,
      const random_g_otp = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      //hash the otp
      const otp = await bcrypt.hash(random_g_otp, 10);

      // Save the OTP in Redis with a 15-minute expiration
      await this.redisService.saveKeyValueInRedis({
        key: generateOtpDto.email,
        exp_in: 15 * 60, // for 15m
        data: otp,
      });

      // send the otp (will valid for 15m )
      // await this.emailService.sendEmail({
      //   to: generateOtpDto.email,
      //   html: ` <body style="font-family: system-ui, math, sans-serif">
      //   <div>
      //     Hotel Booking page , OTP MAIL
      //     <br />
      //       <h1>YOUR OTP IS :${random_g_otp}</h1>
      //       <h4>This otp is valid for 15m </h4>
      //   </div>
      // </body>`,
      //   subject: 'Hotel Booking page , OTP MAIL',
      //   text: 'otp send ',
      // });

      return { status: 1, otp, random_g_otp, msg: 'otp genaration sucessfull' };
    } catch (error) {
      // Handle specific error scenarios
      // if (error instanceof "") {
      //   throw new InternalServerErrorException('Specific error occurred');
      // }
      throw new InternalServerErrorException(
        'An error occurred while generating OTP',
      );
    }
  }

  async verifyEmailByOtp(varifyOtpDto: EmailVerification_byOtpDto) {
    const { email, otp } = varifyOtpDto;
    try {
      const otpFrom_redis =
        await this.redisService.getValueByKey_withClearKey_value({
          key: email,
        });
      const otp_verification = await bcrypt.compare(otp, otpFrom_redis.otp);

      if (otp_verification) {
        //PANDING:  update the db that the email is varified
        return { email, otp_verification, msg: 'email verified' };
      }
      return { email, otp_verification, msg: 'email not verified' };
    } catch (error) {
      return {
        error,
        msg: 'error for varify the otp. process incomplete',
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
