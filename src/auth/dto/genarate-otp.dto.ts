import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, IsString } from 'class-validator';

export class GenerateOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsString()
  email: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'User mobile number with country code',
  })
  @IsPhoneNumber(null, {
    message: 'Please provide a valid mobile_with_country_code ',
  })
  mobile_with_country_code?: string;
}
