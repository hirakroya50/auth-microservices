import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
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
import { SmsService } from 'src/sms/sms.service';
import { SignInDto } from './dto/signIn.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly otpRedisKeyPrefix: string;
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private redisService: RedisService,
    private smsService: SmsService,
    private configService: ConfigService,
    // private KEY_FOR_REDIS: string,
  ) {
    this.otpRedisKeyPrefix = this.configService.get<string>(
      'KEY_FOR_SAVE_OTP_REDIS',
    );
  }

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
    const { email, password, username, mobile } = signUpData;

    try {
      // Check if user with the email already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }, { mobile }],
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
          mobile,
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
    const { email, mobile_with_country_code } = generateOtpDto;

    //check the user email is already exist or not
    let user: User;
    if (email) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });
    } else {
      throw new BadRequestException('email is required');
    }
    //check user exist or not
    if (!user) {
      throw new NotFoundException('user not exist');
    }

    //check user verified  or not
    if (user?.isVerified) {
      throw new ConflictException('email already verified ');
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
        key: this.otpRedisKeyPrefix + email,
        exp_in: 15 * 60, // for 15m
        data: otp,
      });

      //Send the otp in sms
      if (mobile_with_country_code) {
        await this.smsService.sendSms({
          body: `OTP for the app , your OTP :  ${random_g_otp} . this otp will valid for 15m`,
          to: mobile_with_country_code,
        });
      }

      // send the otp in mail (will valid for 15m )
      await this.emailService.sendEmail({
        to: email,
        html: ` <body style="font-family: system-ui, math, sans-serif">
          <div>
            Hotel Booking page , OTP MAIL
            <br />
              <h1>YOUR OTP IS :${random_g_otp}</h1>
              <h4>This otp is valid for 15m </h4>
          </div>
        </body>`,
        subject: 'Hotel Booking page ,OTP MAIL',
        text: 'otp send',
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'OTP generated successfully',
      };
    } catch (error) {
      // Handle specific error scenarios
      // if (error instanceof "") {
      //   throw new InternalServerErrorException('Specific error occurred');
      // }
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while generating OTP',
      );
    }
  }

  async verifyEmailByOtp(verifyOtpDto: EmailVerification_byOtpDto) {
    const { email, mobile_with_country_code, otp } = verifyOtpDto;
    try {
      // FROM HERE ---- 8 november 19.36pm
      // i have test that redis data is consol or not
      let otpFrom_redis;

      if (email) {
        otpFrom_redis =
          await this.redisService.getValueByKey_withClearKey_value({
            key: this.otpRedisKeyPrefix + email,
          });
      } else {
        throw new BadRequestException('Email is required for verification');
      }

      if (!otpFrom_redis) {
        throw new NotFoundException('No OTP data found or OTP has expired');
      }

      const otp_verification = await bcrypt.compare(otp, otpFrom_redis.data);

      if (!otp_verification) {
        throw new UnauthorizedException('Incorrect OTP');
      }
      //  update the db that the email is verified
      await this.prisma.user.update({
        where: { email },
        data: { isVerified: true },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Email verified successfully',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred during OTP verification',
      );
    }
  }

  private readHtmlTemplate(templateName: string): string {
    // auth-microservices/templates/token-expired.html
    // /Users/hirakroy/Documents/GitHub/auth-microservices/src/templates/token-expired.html
    const filePath = path.join(__dirname, '../templates', templateName);
    return fs.readFileSync(filePath, 'utf-8');
  }

  async sendEmailForUserVerificationByUrl(emailSendBodyDto: EmailSendBodyDto) {
    const { email } = emailSendBodyDto;
    try {
      //genarate the url for dev mode / production mote => then send that in url

      // Check if user with the email already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email,
        },
      });

      // Log the notfound
      if (!existingUser) {
        throw new NotFoundException('Email not added . signup first');
      }
      // genarate a random string as Toekn

      let token = randomBytes(10).toString('hex').slice(0, 10); // Outputs a random string of length 10
      console.log(token);

      // save that in redis for 15m by key name email
      const redis = await this.redisService.saveKeyValueInRedis({
        key: emailSendBodyDto.email + this.otpRedisKeyPrefix,
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

      return {
        statusCode: HttpStatus.OK,
        email,
        dev_url,
        message: 'Verification email sent successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while sending the verification email',
      });
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
          key: email + this.otpRedisKeyPrefix,
        });

      // if the token has expire then allso send a html
      if (!otpFrom_redis?.data) {
        // return this.readHtmlTemplate('token-expired.html');
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
              <a href="yourapp://redirect">Go back to the app for re verify again</a>
            </body>
          </html>
        `;
      }

      // now just varify the token
      // if all okk then send a html => that user has varified /
      if (otpFrom_redis?.data === token) {
        //  update the db that the email is verified
        await this.prisma.user.update({
          where: { email },
          data: { isVerified: true },
        });

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

  //SIGN-IN

  async signIn(signInDto: SignInDto) {
    const { email, mobile, password, username } = signInDto;
    try {
      const user_info = email ? { email } : mobile ? { mobile } : { username };

      const user = await this.prisma.user.findUnique({
        where: user_info,
      });

      if (!user) {
        throw new ConflictException('user not exist!');
      }

      //signin logic
      // make auth in email / username or phone no .
      // then get varify the user then
      //  the  generate the jwt token

      return { status: 1, signInDto };
    } catch (error) {
      return { status: 'error' };
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
