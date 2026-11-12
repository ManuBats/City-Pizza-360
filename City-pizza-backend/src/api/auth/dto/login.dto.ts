import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  usuario!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}
