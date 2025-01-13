import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  ValidateIf,
} from 'class-validator';

export class EmailVerification_byOtpDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description:
      'User email address (required if mobile_with_country_code is not provided)',
  })
  @ValidateIf((o) => !o.mobile_with_country_code)
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description:
      'User mobile number with country code (required if email is not provided)',
  })
  @ValidateIf((o) => !o.email)
  @IsPhoneNumber(null, {
    message: 'Please provide a valid mobile_with_country_code',
  })
  mobile_with_country_code?: string;

  @ApiProperty({
    example: '123456',
    description: 'One-time password (OTP) for verification',
  })
  @IsNotEmpty({ message: 'OTP cannot be empty' })
  otp: string;
}
