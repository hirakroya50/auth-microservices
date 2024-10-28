import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class EmailSendBodyDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please give correct mailed' })
  @IsString()
  email: string;
}
