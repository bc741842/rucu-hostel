import { IsDateString, IsString, Matches } from 'class-validator';

export class CreateAcademicYearDto {
  @IsString()
  @Matches(/^\d{4}\/\d{4}$/, { message: 'Name must look like 2026/2027' })
  name!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;
}
