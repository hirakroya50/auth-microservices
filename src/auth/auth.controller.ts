import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Redirect,
  Req,
  Request,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
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
import { Response, Request as ExpressRequest } from 'express';
// src/auth/dto/generate-otp-response.dto.ts

import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { VerifyUserEmailDtoByLink } from './dto/verify-user-email-byLink.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
@ApiTags('Draft')
@ApiBearerAuth()
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}
  // t'odo

  // --------route for role base access------------------------------------------------------
  @Get('/user')
  @Roles('USER')
  getUserData() {
    return { message: 'USER data' };
  }

  @Get('/admin')
  @Roles('ADMIN')
  getAdminData() {
    return { message: 'admin data' };
  }
  // --------------------------------------------------------------

  @Get('jwt-protected-route')
  @UseGuards(JwtAuthGuard) // Protect the endpoint
  async dummyOperation(@Request() req) {
    // Perform a dummy operation (e.g., return a success message)
    console.log(req.user);
    return this.authService.jwtTokenVarfytest();
  }
  // 1
  //***************************** SingUP ********************************************************************* */

  @Post('/sign-up')
  async signup(@Body() signupDto: SignUpDto) {
    return this.authService.api_signUp(signupDto);
  }

  //*****************************OTP genaration and verification ******************************************** */

  @ApiOkResponse({ type: GenerateOtpResponseDto })
  @Post('/generate-otp')
  // apply logic for the rate limiting type - 2 by @Throttle()
  // @Throttle({ default: { limit: 3, ttl: 60 * 1000 } })
  async generateOtp(@Body() generateOtpDto: GenerateOtpDto) {
    return await this.authService.api_generateOtp(generateOtpDto);
  }

  @Post('/verify-otp')
  async verifyOtp(@Body() verifyOtpDto: EmailVerification_byOtpDto) {
    return await this.authService.api_verifyEmailByOtp(verifyOtpDto);
  }
  //***************************** verification email genaration & get varified by link  ********************** */

  //FROM HERE
  // /singup . /generate-otp /verify-otp check kora hoyeche .
  // link diye user ke verify kora ta dhekte hbe
  //CHECK START FROM HERE
  @Get('/send-email-user-verification')
  async sendEmailForUserVerificationByUrl(
    @Body() emailSendBodyDto: EmailSendBodyDto,
  ) {
    return await this.authService.api_sendEmailForUserVerificationByUrl(
      emailSendBodyDto,
    );
  }

  @Get('/verify-user')
  // @Redirect('https://url_for_thefrontnd.com')   // redirect logic // redirect the user after varified .
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async verifyUserEmailByUrl(@Query() query: VerifyUserEmailDtoByLink) {
    return await this.authService.api_verifyUserEmailByUrl(query);
    // without returning the html directy we can redirect our user in the frontend app
    // return { url: `https://url_for_thefrontnd.com` };
  }

  //***************************** SignIN *************************************************************************** */

  @Post('/sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @Req() req: ExpressRequest,
    @Res() res: Response,
  ) {
    // have to test that ip addres console in PROD
    let ipAddress = req.ip || req.connection.remoteAddress;
    return this.authService.api_signIn({ signInDto, ipAddress, res });
  }

  @Post('/access-token-test')
  async accessTokenTest(@Req() req: ExpressRequest, @Res() res: Response) {
    return this.authService.accessTokenTest({ req, res });
  }

  @Post('/refreshToken')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.api_refreshToken(refreshToken);
  }

  //*****************LOGOUT*************************************************************************************** */
  @Post('/logout')
  async logout(@Res() res: Response) {
    return this.authService.api_logout(res);
  }
  //******************************************************************************************************** */

  @Get('/')
  async getUser() {
    return await this.authService.api_getAll();
  }
  @Delete('/')
  async deleteUser() {
    return await this.authService.api_deleteUser();
  }
}
