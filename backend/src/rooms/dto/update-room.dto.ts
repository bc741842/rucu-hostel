import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';
 
export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  number?: string;
 
  @IsOptional()
  @IsInt()
  floor?: number;
 
  @IsOptional()
  @IsNumber()
  price?: number;
}