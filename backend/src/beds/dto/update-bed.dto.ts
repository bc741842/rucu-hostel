import { IsString, IsOptional, IsIn } from 'class-validator';
 
export class UpdateBedDto {
  @IsOptional()
  @IsString()
  number?: string;
 
  @IsOptional()
  @IsIn(['free', 'held', 'occupied', 'maintenance'])
  status?: string;
}
 


