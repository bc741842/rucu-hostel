import { IsString } from 'class-validator';
 
export class LoginDto {
  // Inaweza kuwa RegNo (mwanafunzi) AU username (admin/accountant/warden)
  @IsString()
  identifier!: string;
 
  @IsString()
  password!: string;
}