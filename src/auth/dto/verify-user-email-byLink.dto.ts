// verify-user-email.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class VerifyUserEmailDtoByLink {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The verification token sent to the user’s email',
    example: 'some-random-token',
  })
  @IsString()
  token: string;
}
