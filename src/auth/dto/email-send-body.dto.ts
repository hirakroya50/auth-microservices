import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailSendBodyDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'hirakroya50@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please give correct mailed' })
  email: string;
}
