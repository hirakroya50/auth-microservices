import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SignInDto {
  @ValidateIf((o) => !o.username && !o.mobile)
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ValidateIf((o) => !o.email && !o.mobile)
  @IsString({ message: 'Username must be a string' })
  username: string;

  @ValidateIf((o) => !o.email && !o.username)
  @IsPhoneNumber(null, { message: 'Please provide a valid mobile number' })
  mobile: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password: string;
}
