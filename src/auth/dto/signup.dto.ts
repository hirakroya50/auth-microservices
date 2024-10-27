import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignUpDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email: string;

  @IsNotEmpty({ message: 'OTP cannot be empty' })
  otp: string;
}
