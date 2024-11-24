import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GenerateOtpDto } from './dto/genarate-otp.dto';
import { PrismaService } from 'src/prisma/prisma.service';

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
import { VerifyUserEmailDtoByLink } from './dto/verify-user-email-byLink.dto';

import * as htmlTemplates from '../utils/html-response.util';
import { JwtService } from '@nestjs/jwt';
import { Response, Request as ExpressRequest } from 'express';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly otpRedisKeyPrefix: string;
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private redisService: RedisService,
    private smsService: SmsService,
    private configService: ConfigService,
    private jwtService: JwtService,
    // private KEY_FOR_REDIS: string,
  ) {
    this.otpRedisKeyPrefix = this.configService.get<string>(
      'KEY_FOR_SAVE_OTP_REDIS',
    );
  }

  async jwtTokenVarfytest() {
    return { message: 'Dummy operation successful', status: 'succesnjjs' };
  }

  /**
   * Signup a new user in the system.
   *
   * This function takes in user sign-up data, checks if the email or username
   * already exists, and creates a new user with a hashed password if both
   * are unique. Returns the created user data excluding the password.
   * @param {SignUpDto} signUpData - The sign-up data containing email, username, and password.
   */

  async api_signUp(signUpData: SignUpDto) {
    const { email, password, username, mobile } = signUpData;

    try {
      // Check if user with the email already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }, { mobile }],
        },
      });

      // Handle potential conflicts with existing users
      this.checkUserForConflicts_ForSignup(existingUser, email, username);

      // Hash the password
      const hashedPassword = await this.hashPassword(password);
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
      return {
        statusCode: HttpStatus.CREATED,
        message: 'User created successfully',
        user: userWithoutPassword,
      };
    } catch (error) {
      this.handleSignUpError(error);
    }
  }

  async api_generateOtp(generateOtpDto: GenerateOtpDto) {
    const { email, mobile_with_country_code } = generateOtpDto;

    //check the user email is already exist or not
    let user;
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

  async api_verifyEmailByOtp(verifyOtpDto: EmailVerification_byOtpDto) {
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

  async api_sendEmailForUserVerificationByUrl(
    emailSendBodyDto: EmailSendBodyDto,
  ) {
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
      if (!existingUser)
        throw new NotFoundException('Email not added . signup first');

      // genarate a random string as Toekn
      let token = this.generateVerificationToken(); // Outputs a random string of length 10

      // save that in redis for 15m by key name email
      await this.saveTokenInRedis(email, token);

      // genarate a url
      const verificationUrl = this.generateVerificationUrl(email, token);

      // send the email
      await this.emailService.sendEmail({
        to: emailSendBodyDto.email,
        html: ` <body style="font-family: system-ui, math, sans-serif">
        <div>
          <p>Email Verification : this url is valid for 15 minutes</p>
          <h1>DEV:</h1>
          <p><a href="${verificationUrl.dev}" style="color: blue; text-decoration: underline;">Click here to verify your email (Development)</a></p>
          <br/>
          <p>copy url:${verificationUrl.prod} </p>

          <h1>PROD:</h1>
          <p><a href="${verificationUrl.prod}" style="color: blue; text-decoration: underline;">Click here to verify your email (Production)</a></p>
        </div>
      </body>`,
        subject: 'User Email Verification',
        text: 'Please verify your email address ',
      });

      return {
        statusCode: HttpStatus.OK,
        email,
        dev_url: verificationUrl.dev,
        message: 'Verification email sent successfully',
      };
    } catch (error) {
      this.handleException(error);
    }
  }

  //PB
  //IMPOTENT : work have to add the file base html render .
  // how can i access files in nest js ? by fs module
  async api_verifyUserEmailByUrl({ email, token }: VerifyUserEmailDtoByLink) {
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
        return htmlTemplates.tokenExpiredHtml();
      }

      // now just varify the token
      // if all okk then send a html => that user has varified /
      if (otpFrom_redis?.data === token) {
        //  update the db that the email is verified
        await this.prisma.user.update({
          where: { email },
          data: { isVerified: true },
        });

        return htmlTemplates.emailVerifiedHtml();
      }

      // if not invaild give a html that user has not varified

      return htmlTemplates.verificationFailedHtml();
    } catch (error) {
      return htmlTemplates.errorHtml();
    }
  }

  //SIGN-IN
  async api_signIn({
    signInDto,
    ipAddress,
    res,
  }: {
    signInDto: SignInDto;
    ipAddress: string;
    res: Response;
  }) {
    const { email, mobile, password, username } = signInDto;
    const user_info = email ? { email } : mobile ? { mobile } : { username };

    if (!user_info)
      throw new ConflictException('No valid login information provided');

    try {
      const user = await this.prisma.user.findUnique({
        where: user_info,
      });

      if (!user) {
        throw new ConflictException('user not exist!');
      }

      // Get location based on IP
      const location = await this.getLocationFromIP(ipAddress);
      console.log(location);
      //MODIFICATION FOR LOOCATION / IP FEATURE
      // cant test this feature . this have to test in PROD. and cant get the loction for all machine . have to reserch on that
      //SAVE THE LOGIN ATTEM WITH IP AND LOCATION IN THE DATABASE AND
      //ALSO NOTIFY THE USER WHEN MAKE A LOGIN
      // make this location  ip feature in sycronusly so that that will not effect the main flow of the loin
      // login in api sould be fast

      // Validate the password
      const isPasswordValid = await this.validatePassword(
        password,
        user?.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Incorrect password');
      }

      // JWT Token Generation
      const { accessToken, refreshToken } = this.generateJwtToken({
        email: user.email,
        id: user.id,
        role: user.role,
      });
      //set the http cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true, //value will be true => process.env.NODE_ENV === 'production',// Ensure it's only sent over HTTPS in production
        sameSite: 'strict', // Protect against CSRF attacks,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(HttpStatus.OK).json({
        status: 1,
        msg: 'Sign-in successful',
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Error during sign-in:', error);
      if (
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      )
        throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'an error coming at signIn',
      });
    }
  }

  //get the location by ip address
  private async getLocationFromIP(ip: string): Promise<any> {
    const apiKey = this.configService.get<string>('IPSTACK_API_AccessKey');
    // for localhost / dev modee
    if (ip === '127.0.0.1' || ip === '::1') {
      return { city: 'Localhost', country: 'Local', region: 'Local' };
    }

    try {
      // 134.201.250.155
      const response = await axios.get(
        `https://api.ipstack.com/${ip}?access_key=${apiKey}&format=1`,
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching location:', error);
      return null;
    }
  }

  //LOGOUT
  async api_logout(res: Response) {
    try {
      // Clear the access token cookie
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: true, //only for dev mode Ensure it's only sent over HTTPS in production
        sameSite: 'strict', // Protect against CSRF attacks
      });

      // If needed, add logic to invalidate tokens (e.g., remove refresh tokens from DB/Redis)
      // For example: await this.invalidateToken(userId);

      return res.status(HttpStatus.OK).json({
        status: 1,
        msg: 'Logout successful',
      });
    } catch (error) {
      console.error('Error during logout:', error);
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred during logout',
      });
    }
  }

  async accessTokenTest({ req, res }: { req: ExpressRequest; res: Response }) {
    try {
      console.log('refresh cookies ======', req?.cookies);

      // Extract refresh token from cookies
      const accessToken = req?.cookies?.accessToken;
      console.log('refresh token ======', accessToken);

      if (!accessToken) {
        throw new HttpException(
          'No accessToken  provided',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Return a success response
      return res.status(HttpStatus.OK).json({ accessToken });
      return {
        accessToken,
      };
    } catch (error) {
      console.error('Error during refresh token:', error.message);

      // Return an error response
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //REFRESH TOKEN
  async api_refreshToken(refreshToken: string) {
    try {
      const decoded = await this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      //// Check if the token is valid and exists in the database
      // const storedToken = await this.prisma.refreshToken.findFirst({
      //   where: { token: refreshToken, userId: decoded.id },
      // });

      // if (!storedToken) {
      //   throw new UnauthorizedException('Invalid or expired refresh token');
      // }

      const tokens = this.generateJwtToken({
        email: decoded?.email,
        id: decoded?.userId,
        role: decoded?.role,
      });

      // Update the refresh token in the database (optional)
      // await this.prisma.refreshToken.update({
      //   where: { id: storedToken.id },
      //   data: { token: tokens.refreshToken },
      // });
      return { tokens };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  //GET ALL THE USER
  async api_getAll() {
    try {
      const allUser = await this.prisma.user.findMany();
      return { allUser };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  //DELETE THE "MY EMAIL" JUST FOR TESTING
  async api_deleteUser() {
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

  //Function for --------------signIn---------
  private async validatePassword(
    inputPassword: string,
    storedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(inputPassword, storedPassword);
  }
  private generateJwtToken(data: {
    id: string | number;
    email: string;
    role: 'USER' | 'ADMIN' | 'MANAGER';
  }): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = { userId: data.id, email: data.email, role: data.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }
  //--------------------------end---------------

  // functions for ------api_sendEmailForUserVerificationByUrl
  private readHtmlTemplate(templateName: string): string {
    // auth-microservices/templates/token-expired.html
    // /Users/hirakroy/Documents/GitHub/auth-microservices/src/templates/token-expired.html
    const filePath = path.join(__dirname, '../templates', templateName);
    return fs.readFileSync(filePath, 'utf-8');
  }
  private generateVerificationToken(): string {
    return randomBytes(10).toString('hex').slice(0, 10);
  }
  private async saveTokenInRedis(email: string, token: string): Promise<void> {
    const redis = await this.redisService.saveKeyValueInRedis({
      key: email + this.otpRedisKeyPrefix,
      exp_in: 15 * 60, // for 15m
      data: token,
    });
  }

  private generateVerificationUrl(email: string, token: string) {
    const baseDevUrl = this.configService.get<string>('DEV_BASE_URL');
    const baseProdUrl = this.configService.get<string>('PROD_BASE_URL');
    const devUrl = `${baseDevUrl}/auth/verify-user?email=${email}&token=${token}`;
    const prodUrl = `${baseProdUrl}/auth/verify-user?email=${email}&token=${token}`;

    return { dev: devUrl, prod: prodUrl };
  }

  private handleException(error: any): never {
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException
    )
      throw error;

    throw new InternalServerErrorException({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An error occurred while sending the verification email',
    });
  }

  // functions for ----api_sendEmailForUserVerificationByUrl---- end----

  // functions for sign up-----------------------
  private checkUserForConflicts_ForSignup(
    existingUser: any,
    email: string,
    username: string,
  ): void {
    if (!existingUser) return;

    if (existingUser.email === email) {
      throw new ConflictException('Email already in use');
    }
    if (existingUser.username === username) {
      throw new ConflictException('Username already in use');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private handleSignUpError(error: any): never {
    // Handle errors that occurred during user existence check
    if (error?.response?.error === 'Conflict') {
      // Handle known request errors (like unique constraints)
      throw new ConflictException(error.response.message);
    } else {
      // Handle unexpected errors
      throw new InternalServerErrorException('Failed to create user');
    }
  }
  // functions for sign up ---------end --------
}
