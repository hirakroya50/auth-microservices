import { IsString, IsNotEmpty } from 'class-validator';

export class LpushBodyDto {
  @IsString()
  @IsNotEmpty()
  data: string;
}
