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
import { randomBytes } from 'crypto';
import { EmailSendBodyDto } from './dto/email-send-body.dto';
import * as fs from 'fs';
import * as path from 'path';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private redisService: RedisService,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  //done  Signup steps => get the user first data : "email",, "password" username , DOB, others , mob no(optonal )
  // done // => save the data and create the account
  // then on the next page give a option to varify the email
  // without varify the email user can login to the app .
  // but without varify the email user only and see the analiics , data and other tigs .
  // without varify the email user can get the total acces

  /**
   * Signup a new user in the system.
   *
   * This function takes in user sign-up data, checks if the email or username
   * already exists, and creates a new user with a hashed password if both
   * are unique. Returns the created user data excluding the password.
   * @param {SignUpDto} signUpData - The sign-up data containing email, username, and password.
   */
  async signUp(signUpData: SignUpDto) {
    const { email, password, username } = signUpData;

    try {
      // Check if user with the email already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      // Log the conflict scenario. if user email and username is present in the adtabase
      if (existingUser) {
        if (existingUser.email === email) {
          throw new ConflictException('Email already in use');
        }
        if (existingUser.username === username) {
          throw new ConflictException('Username already in use');
        }
      }

      // HASH
      const hashedPassword = await bcrypt.hash(password, 10);
      //CREATE
      const user = await this.prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
        },
      });

      // Omit the password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      // Handle errors that occurred during user existence check
      if (error?.response?.error === 'Conflict') {
        // Handle known request errors (like unique constraints)
        throw new ConflictException(error.response.message);
      } else {
        // Handle unexpected errors
        console.error('Error creating user:', error);
        throw new InternalServerErrorException('Failed to create user');
      }
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
      const otp_verification = await bcrypt.compare(otp, otpFrom_redis.data);

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

  async verifyUserEmailByUrl({
    email,
    token,
  }: {
    email: string;
    token: string;
  }) {
    try {
      // get the saved token form redis
      const otpFrom_redis =
        await this.redisService.getValueByKey_withClearKey_value({
          key: email + 'urlVerification',
        });
      console.log(otpFrom_redis);

      // if the token has expire then allso send a html
      if (!otpFrom_redis?.data) {
        // apply the templates to return the html
        // const filePath = path.join(
        //   __dirname,
        //   '..',
        //   'templates',
        //   `token-expired.html`,
        // );
        // console.log(filePath);
        // return fs.readFileSync(filePath, 'utf-8');
        return `
          <html>
            <body>
              <h2>Token Expired</h2>
              <p>The token for email verification has expired.</p>
              <a href="yourapp://redirect">Go back to the app</a>
            </body>
          </html>
        `;
      }
      // now just varify the token
      // if all okk then send a html => that user has varified /
      if (otpFrom_redis?.data === token) {
        return `
          <html>
            <body>
              <h2>Email Verified Successfully</h2>
              <p>Your email has been verified. You can now use the app.</p>
              <a href="yourapp://redirect">Go to the app</a>
            </body>
          </html>
        `;
      }

      // if not invaild give a html that user has not varified

      return `
        <html>
          <body>
            <h2>Verification Failed</h2>
            <p>The token does not match. Please try again.</p>
            <a href="yourapp://redirect">Go back to the app</a>
          </body>
        </html>
      `;
    } catch (error) {
      return `
        <html>
          <body>
            <h2>Error</h2>
            <p>There was an error during verification. Please try again later.</p>
          </body>
        </html>
      `;
    }
  }

  async sendEmailForUserVerificationByUrl(emailSendBodyDto: EmailSendBodyDto) {
    try {
      //genarate the url for dev mode / production mote => then send that in url

      // genarate a random string as Toekn
      let token = randomBytes(10).toString('hex').slice(0, 10); // Outputs a random string of length 10
      console.log(token);

      // save that in redis for 15m by key name email
      await this.redisService.saveKeyValueInRedis({
        key: emailSendBodyDto.email + 'urlVerification',
        exp_in: 15 * 60, // for 15m
        data: token,
      });

      // genarate a url

      const dev_url = `http://localhost:3001/auth/verify-user?email=${emailSendBodyDto.email}&token=${token}`;
      const prod_url = `http://www.somewebsite.com/auth/verify-user?email=${emailSendBodyDto.email}&token=${token}`;

      // send the email
      // get method (http )
      //url:  localhost:3001/auth/otp-varification?email=emissl@hirak.com&token=sadjhasvdavs

      await this.emailService.sendEmail({
        to: emailSendBodyDto.email,
        html: ` <body style="font-family: system-ui, math, sans-serif">
        <div>
          <p>Email Verification : this url is valid for 15 minutes</p>
          <h1>DEV:</h1>
          <p><a href="${dev_url}" style="color: blue; text-decoration: underline;">Click here to verify your email (Development)</a></p>
          <br/>
          <p>copy url:${dev_url} </p>

          <h1>PROD:</h1>
          <p><a href="${prod_url}" style="color: blue; text-decoration: underline;">Click here to verify your email (Production)</a></p>
        </div>
      </body>`,
        subject: 'User Email Verification',
        text: 'Please verify your email address ',
      });

      return { token, email: emailSendBodyDto.email, dev_url };
    } catch (error) {
      return {
        ero: 'error',
        error,
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
