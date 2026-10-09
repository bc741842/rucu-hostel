import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MaintenanceStatus } from '@prisma/client';
 
export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status!: MaintenanceStatus;
 
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolvedNote?: string;
}
 