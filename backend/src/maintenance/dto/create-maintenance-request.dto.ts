import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
 
export class CreateMaintenanceRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  location!: string; // e.g. "My room (12B)" or "2nd floor common bathroom"
 
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;
}
 