import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GenerateOtpDto } from './dto/genarate-otp.dto';
import { GenerateOtpResponseDto } from './res-dto/GenerateOtpResponse.dto';
// src/auth/dto/generate-otp-response.dto.ts

@ApiTags('Draft')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  // 1
  @ApiOkResponse({ type: GenerateOtpResponseDto })
  @Post('/')
  async generateOtp(@Body() generateOtpDto: GenerateOtpDto) {
    return await this.authService.generateOtp({ generateOtpDto });
  }
  @Get('/get-sigup-otp')
  async getSignUpotp() {
    return await this.authService.getSignUpOtp();
  }
  @Get('/')
  async getUser() {
    return await this.authService.getAll();
  }
  @Delete('/')
  async deleteUser() {
    return await this.authService.deleteUser();
  }
}

// auth service doc
/*
1, send a post(body: email or phone no , and user-name) request and genarate a otp 
2, user will get  a otp in the email or mobile
or , user will get  a link in the email or phone , by clicking he can set the password 
or , user will recived a username and password in the mail and or mobile 
(this will be validated for 15m only )

or , for google / github login user will get a welcome mail in the email and or in the mobile 

AFTER SETTING UP THE PASSWORD the sign up process will be complited.

this data will be saved in sql database. 

after first login/ after first google / github login ,  user will get  a popup for fill the user details , 
(user can skip this part for later )

auth token will be saved in the messege que 

3. FORGET PASSWORD : 
 if user requst ofr foegt : user will get a email nd phn otp verifiction that 
 will get to change the password window 



 


 //////////
 ADDITIONAL FEATURE SUGGEST BY CHAT GPT : 


 1. OAuth 2.0 /
Support for OAuth 2.0/OpenID Connect (for Google, GitHub, etc.)
- Implement token exchange and refresh token mechanisms for longer sessions.
- Allow users to link multiple third-party accounts (Google, GitHub, etc.) to a single user profile.

2. Role-Based Access Control (RBAC):  like Admin, User, Moderator, etc., and implement role-based access control.
Create policies that restrict or grant access to certain resources or actions based on the role.

3. Two-Factor Authentication (2FA)
-two-factor authentication (2FA) via email, SMS, or authenticator apps like Google Authenticator.
-Add an option for users to enable/disable 2FA for their accounts.

4. Refresh Token Mechanism
- refresh token system to extend user sessions without requiring them to log in frequently.
-Store refresh tokens securely in a database or in-memory store like Redis and use JWT for access tokens.
-Include an option for users to invalidate or revoke refresh tokens (e.g., logout from all devices).

5. Rate Limiting and Brute Force Protection
- Add rate limiting (e.g., limit OTP requests or login ).
- Use  @nestjs/throttler for rate-limiting.
-Implement automatic account lockout after a certain number of failed attempts with a temporary block.

6. Session Management
- multiple user sessions from different devices, terminate active sessions. users to log out from all devices.

7. Password Policy and Strength Validation
-Enforce a password policy (e.g., minimum length, special characters, numbers, etc.).

8. Event-Driven Architecture
- Use an event-driven architecture for better decoupling and scalability.
- For example, use message queues (RabbitMQ, Kafka, etc.) for actions like sending OTPs, verification emails, or triggering post-login events.

9. Audit Logging and Activity Monitoring
- Track user activities such as login attempts, password changes, and account updates for security auditing.
-Provide an endpoint or interface where users can view their recent login and account activity.

10. Email and SMS Templates
 -Customize email and SMS templates for user notifications, OTPs, welcome messages, and password reset links.
 -Support multiple languages for these templates if you're targeting a global user base.

11. Forgot Username
- Along with "Forgot Password," add a "Forgot Username" feature, where users can retrieve their username via email or SMS.

12. IP and Location Tracking for Security
- Log the IP address and location (approximate) of every login attempt and notify users of unusual login attempts.
- Provide users with an option to enable or disable notifications for logins from new devices or locations.

13. Passwordless Authentication
-Offer passwordless login via magic links or one-time codes.

14. API Rate Limiting for Public APIs
- RATE LIMITE FOR FREE USER / AND UNLIMITE FOR PAID / OR ACCESS PERMITION AS PER THE PACKEGE : IN MONTH , WEEK , YEAR 
- Implement API rate limiting for clients using your authentication API to prevent abuse and ensure fair usage.
- Allow the configuration of different rate limits based on client roles or types.

16. User Verification (KYC)
- Implement optional identity verification (KYC) for certain user roles, such as admins or vendors, to ensure verified identities.

17. Token Revocation
Provide an API or background service to revoke JWT tokens when required 
(e.g., when a user logs out, or in case of a security breach).

 */
