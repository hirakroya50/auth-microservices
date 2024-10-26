import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendOtpMailDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  to: string;

  @IsString()
  @IsNotEmpty({ message: 'HTML content is required' })
  html: string;

  @IsString()
  @IsNotEmpty({ message: 'Email subject is required' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Text content is required' })
  text: string;
}
