import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SignInDto {
  @ApiPropertyOptional({
    example: 'hirakroya50@gmail.com',
    description:
      'User email address (required if username or mobile is not provided)',
  })
  @ValidateIf((o) => !o.username && !o.mobile)
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiPropertyOptional({
    example: 'username123',
    description: 'Username (required if email or mobile is not provided)',
  })
  @ValidateIf((o) => !o.email && !o.mobile)
  @IsString({ message: 'Username must be a string' })
  username: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description:
      'User mobile number (required if email or username is not provided)',
  })
  @ValidateIf((o) => !o.email && !o.username)
  @IsPhoneNumber(null, { message: 'Please provide a valid mobile number' })
  mobile: string;

  @ApiProperty({
    example: 'hirakroya50@gmail.com',
    description: 'Password for the user account',
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password: string;
}
