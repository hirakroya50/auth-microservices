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
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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

interface CustomRequest extends ExpressRequest {
  user?: any; // Adjust the type based on your `user` object structure
}
@ApiBearerAuth()
@Controller('auth')
// @UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}
  // t'odo

  // --------route for role base access------------------------------------------------------
  @ApiTags('role based access')
  @Get('/user')
  @Roles('USER')
  @UseGuards(JwtAuthGuard)
  getUserData() {
    return { message: 'USER only data' };
  }

  @ApiTags('role based access')
  @Get('/admin')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard)
  getAdminData() {
    return { message: 'admin access only data' };
  }

  @ApiTags('role based access')
  @Get('/manager')
  @Roles('MANAGER')
  @UseGuards(JwtAuthGuard)
  getManagerData() {
    return { message: 'MANAGER access only data' };
  }
  // --------------------------------------------------------------
  @ApiTags('signin with -token system logout')
  @Get('protected-route')
  @ApiOperation({
    summary: 'JWT protected route by accessToken',
    description:
      'Access this route only with a valid JWT. Returns a success message after verifying the token. add the accessToken in the Authorization header with "Bearer" in the first',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Protect the endpoint
  async jwtTokenVerifyTest(@Request() req: ExpressRequest) {
    // Perform a dummy operation (e.g., return a success message)
    return this.authService.jwtProtectedRoute(req);
  }
  // 1
  //***************************** SingUP ********************************************************************* */
  @ApiTags('new user signup')
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiBody({ type: SignUpDto, description: 'Payload for user registration' })
  @Post('/sign-up')
  async signup(@Body() signupDto: SignUpDto) {
    return this.authService.api_signUp(signupDto);
  }

  //*****************************OTP genaration and verification ******************************************** */
  @ApiTags('new user signup')
  @ApiOperation({ summary: 'Generate OTP for user authentication' })
  @ApiBody({ type: GenerateOtpDto, description: 'Payload for generating OTP' })
  @ApiOkResponse({ type: GenerateOtpResponseDto })
  @Post('/generate-otp')
  // apply logic for the rate limiting type - 2 by @Throttle()
  // @Throttle({ default: { limit: 3, ttl: 60 * 1000 } })
  async generateOtp(@Body() generateOtpDto: GenerateOtpDto) {
    return await this.authService.api_generateOtp(generateOtpDto);
  }

  @ApiTags('new user signup')
  @ApiOperation({ summary: 'Verify OTP for email or mobile verification' })
  @ApiBody({
    type: EmailVerification_byOtpDto,
    description: 'Payload for verifying OTP for email or mobile',
  })
  @ApiOkResponse({
    description: 'OTP verified successfully',
  })
  @Post('/verify-otp')
  async verifyOtp(@Body() verifyOtpDto: EmailVerification_byOtpDto) {
    return await this.authService.api_verifyEmailByOtp(verifyOtpDto);
  }
  //***************************** verification email genaration & get varified by link  ********************** */

  //FROM HERE
  // /singup . /generate-otp /verify-otp check kora hoyeche .
  // link diye user ke verify kora ta dhekte hbe
  //CHECK START FROM HERE
  @ApiTags('new user signup')
  @ApiOperation({
    summary: 'Send email for user verification',
    description:
      'Sends a verification email to the user with the provided email address.',
  })
  @ApiBody({
    description: 'The email address to send the verification link to.',
    type: EmailSendBodyDto,
  })
  @Post('/send-email-user-verification')
  async sendEmailForUserVerificationByUrl(
    @Body() emailSendBodyDto: EmailSendBodyDto,
  ) {
    return await this.authService.api_sendEmailForUserVerificationByUrl(
      emailSendBodyDto,
    );
  }

  @ApiTags('new user signup')
  @Get('/verify-user')
  @ApiOperation({
    summary: 'Verify user email by URL',
    description:
      'Verifies a user’s email using the provided token and email in the query string.',
  })
  @ApiQuery({
    name: 'email',
    description: 'The email address of the user',
    example: 'user@example.com',
    required: true,
  })
  @ApiQuery({
    name: 'token',
    description: 'The verification token sent to the user’s email',
    example: 'some-random-token',
    required: true,
  })
  // @Redirect('https://url_for_thefrontnd.com')   // redirect logic // redirect the user after varified .
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async verifyUserEmailByUrl(@Query() query: VerifyUserEmailDtoByLink) {
    return await this.authService.api_verifyUserEmailByUrl(query);
    // without returning the html directy we can redirect our user in the frontend app
    // return { url: `https://url_for_thefrontnd.com` };
  }

  //************************************************************************* SignIN ******************************* */
  @ApiTags('signin with -token system logout')
  @ApiOperation({ summary: 'Sign in a user using email, username, or mobile' })
  @ApiBody({
    type: SignInDto,
    description: 'Payload for user sign-in',
  })
  @ApiOkResponse({
    description: 'User signed in successfully',
  })
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
  //************************************************************************* accessTokenTest and refreshToken ********* */
  @ApiTags('signin with -token system logout')
  @ApiOperation({
    summary: 'Refresh token test',
    description: 'Tests the refresh token is saved in the cookie or not',
  })
  @Post('/refresh-token-test')
  async refreshTokenTest(@Req() req: ExpressRequest, @Res() res: Response) {
    return this.authService.refreshTokenTest({ req, res });
  }
  //--------------------------------------------------------------------------------------------------------------------
  @ApiTags('signin with -token system logout')
  @ApiOperation({
    summary: 'Re-generate access token',
    description: 'Generates a new access token using a valid refresh token.',
  })
  @Post('/regenerate-accessToken')
  async reGenerateAccessToken(
    @Req() req: ExpressRequest,
    @Res() res: Response,
  ) {
    return this.authService.reGenerateAccessToken({ req, res });
  }

  //****************************************************************************************LOGOUT**************** */
  @ApiTags('signin with -token system logout')
  @ApiOperation({
    summary: 'Logout user / clear the refresh token form cookie ',
    description:
      'Logs out the user by clearing the session or authentication token.',
  })
  @Post('/logout')
  async logout(@Res() res: Response) {
    return this.authService.api_logout(res);
  }
  //******************************************************************************************GET , Delete user************** */
  @ApiTags('test')
  @Get('/')
  async getUser() {
    return await this.authService.api_getAll();
  }
  @ApiTags('test')
  @Delete('/')
  async deleteUser() {
    return await this.authService.api_deleteUser('royhirakp@gmail.com');
  }
}
