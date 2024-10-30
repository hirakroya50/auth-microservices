import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class GenerateOtpDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsString()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Country code is required' })
  countryCode: string;

  @IsPhoneNumber(null, { message: 'Please provide a valid mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobile: string;
}
