import { IsString, IsNotEmpty } from 'class-validator';
 
export class CreateWaitingEntryDto {
  @IsString()
  @IsNotEmpty()
  hostelId!: string;
 
  @IsString()
  @IsNotEmpty()
  academicYearId!: string;
}