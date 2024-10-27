import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class Create_key_valueDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsInt()
  exp_in: number; // Assuming exp_in represents seconds and should be an integer.

  @IsString()
  @IsNotEmpty()
  data: string;
}
