import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

export class GenerateOtpDto {
  @ValidateIf((o) => !o.mobile_with_country_code)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsString()
  email: string;

  @ValidateIf((o) => !o.email)
  @IsPhoneNumber(null, {
    message: 'Please provide a valid mobile_with_country_code ',
  })
  @IsNotEmpty({ message: 'mobile_with_country_code  is required' })
  mobile_with_country_code: string;
}
