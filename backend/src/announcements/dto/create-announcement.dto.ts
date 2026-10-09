import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
 
export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
 
  @IsString()
  @IsNotEmpty()
  message!: string;
 
  // Optional: leave empty/undefined to target ALL students.
  // Provide a hostelId to target only students currently booked in that hostel.
  @IsOptional()
  @IsString()
  hostelId?: string;
 
  // Optional: a label for the attached PDF, e.g. "Hostel Rules 2026/27".
  // Only meaningful when a file is actually attached on upload.
  @IsOptional()
  @IsString()
  documentTitle?: string;
}
 