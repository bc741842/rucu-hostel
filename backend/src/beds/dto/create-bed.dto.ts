import { IsString } from 'class-validator';
 
export class CreateBedDto {
  @IsString()
  roomId!: string;
 
  @IsString()
  number!: string;
}
 