// verify-user-email.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class VerifyUserEmailDtoByLink {
  @IsEmail()
  email: string;

  @IsString()
  token: string;
}
