import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class GenerateOtpDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please give correct mailed' })
  @IsString()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  username: string;
}
