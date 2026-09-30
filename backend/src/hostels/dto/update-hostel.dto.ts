import { IsString, IsOptional } from 'class-validator';
 
export class UpdateHostelDto {
  @IsOptional()
  @IsString()
  name?: string;
 
  @IsOptional()
  @IsString()
  genderAllowed?: string;
 
  @IsOptional()
  @IsString()
  location?: string;
}