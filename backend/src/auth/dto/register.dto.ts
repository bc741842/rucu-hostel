import {
  IsString,
  IsInt,
  IsOptional,
  IsEmail,
  MinLength,
  Min,
  Max,
} from 'class-validator';
 
export class RegisterDto {
  @IsString()
  regNo!: string;
 
  @IsString()
  name!: string;
 
  @IsString()
  gender!: string;
 
  @IsString()
  course!: string;
 
  @IsInt()
  @Min(1)
  @Max(6)
  year!: number;
 
  @IsOptional()
  @IsString()
  phone?: string;
 
  @IsOptional()
  @IsEmail()
  email?: string;
 
  @IsString()
  @MinLength(8)
  password!: string;
}
 