import { IsString, IsOptional } from 'class-validator';
 
export class CreateHostelDto {
  @IsString()
  name!: string;
 
  @IsString()
  genderAllowed!: string; // "male" au "female"
 
  @IsOptional()
  @IsString()
  location?: string;
}
 