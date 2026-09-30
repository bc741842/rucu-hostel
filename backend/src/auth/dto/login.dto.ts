import { IsString } from 'class-validator';
 
export class LoginDto {
  @IsString()
  regNo!: string;
 
  @IsString()
  password!: string;
}
 