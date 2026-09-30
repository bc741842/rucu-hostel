import { IsString } from 'class-validator';
 
export class CreateBookingDto {
  @IsString()
  bedId!: string;
 
  @IsString()
  academicYearId!: string;
}
 