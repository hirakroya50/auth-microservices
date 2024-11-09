import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  ValidateIf,
} from 'class-validator';

export class EmailVerification_byOtpDto {
  @ValidateIf((o) => !o.mobile_with_country_code)
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ValidateIf((o) => !o.email)
  @IsPhoneNumber(null, {
    message: 'Please provide a valid mobile_with_country_code',
  })
  mobile_with_country_code?: string;

  @IsNotEmpty({ message: 'OTP cannot be empty' })
  otp: string;
}
