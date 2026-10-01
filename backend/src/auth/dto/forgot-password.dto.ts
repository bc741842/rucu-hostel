import { IsString } from 'class-validator';
 
export class ForgotPasswordDto {
  @IsString()
  regNo!: string;
 
  // Email AU simu uliyosajili nayo - lazima ilingane na iliyopo kwenye akaunti
  @IsString()
  contact!: string;
}
 