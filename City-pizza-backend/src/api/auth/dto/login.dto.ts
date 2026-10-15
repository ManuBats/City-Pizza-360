import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  usuario!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  password!: string;
}
