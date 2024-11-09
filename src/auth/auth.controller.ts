import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GenerateOtpDto } from './dto/genarate-otp.dto';
import { GenerateOtpResponseDto } from './res-dto/GenerateOtpResponse.dto';
import { SignUpDto } from './dto/signup.dto';
import { EmailVerification_byOtpDto } from './dto/email-otp-varification.dto';
import { EmailSendBodyDto } from './dto/email-send-body.dto';
import { SignInDto } from './dto/signIn.dto';
// src/auth/dto/generate-otp-response.dto.ts

import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@ApiTags('Draft')
@ApiBearerAuth()
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}
  // 1
  //***************************** SingUP ********************************************************************* */

  @Post('/sign-up')
  async signup(@Body() signupDto: SignUpDto) {
    return this.authService.signUp(signupDto);
  }

  //*****************************OTP genaration and verification ******************************************** */

  @ApiOkResponse({ type: GenerateOtpResponseDto })
  @Post('/generate-otp')
  // apply logic for the rate limiting type - 2 by @Throttle()
  // @Throttle({ default: { limit: 3, ttl: 60 * 1000 } })
  async generateOtp(@Body() generateOtpDto: GenerateOtpDto) {
    return await this.authService.generateOtp(generateOtpDto);
  }

  @Post('/verify-otp')
  async verifyOtp(@Body() verifyOtpDto: EmailVerification_byOtpDto) {
    return await this.authService.verifyEmailByOtp(verifyOtpDto);
    // return verifyOtpDto;
  }
  //***************************** verification email genaration & get varified by link  ********************** */

  @Get('/send-email-user-verification')
  async sendEmailForUserVerificationByUrl(
    @Body() emailSendBodyDto: EmailSendBodyDto,
  ) {
    return await this.authService.sendEmailForUserVerificationByUrl(
      emailSendBodyDto,
    );
  }

  @Get('/verify-user')
  // @Redirect('https://url_for_thefrontnd.com')   // redirect logic // redirect the user after varified .
  async verifyUserEmailByUrl(
    @Query('email') email: string,
    @Query('token') token: string,
  ) {
    return await this.authService.verifyUserEmailByUrl({ email, token });
    // without returning the html directy we can redirect our user in the frontend app
    // return { url: `https://url_for_thefrontnd.com` };
  }

  //***************************** SignIN *************************************************************************** */

  @Post('/sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  //******************************************************************************************************** */

  @Get('/')
  async getUser() {
    return await this.authService.getAll();
  }
  @Delete('/')
  async deleteUser() {
    return await this.authService.deleteUser();
  }
}
//
/*
/ -----------------PAID IMPORTANT WORK ----------
/sigin in logic with jwt token 

1. make a quue by or other  rabit mq, 
1. google github login 
2. forget password logic 
3. jwt token generation after verified login with token expire
      -> token will be valid for 2days 
      -> token will be saved in the redis 
      -> on the 2rd day of token , if the user login or stay login then just auto update the jwt token that will validate for 2day

4. 



 */
