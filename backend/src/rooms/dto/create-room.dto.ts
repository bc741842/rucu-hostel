import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';
 
export class CreateRoomDto {
  @IsString()
  hostelId!: string;
 
  @IsString()
  number!: string;
 
  @IsOptional()
  @IsInt()
  floor?: number;
 
  @IsNumber()
  price!: number;
}
 