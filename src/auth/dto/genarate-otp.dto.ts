import { IsEmail, IsPhoneNumber, IsString } from 'class-validator';

export class GenerateOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsString()
  email: string;

  @IsPhoneNumber(null, {
    message: 'Please provide a valid mobile_with_country_code ',
  })
  mobile_with_country_code?: string;
}
