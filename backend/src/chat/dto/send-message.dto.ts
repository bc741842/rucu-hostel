import { IsString, IsOptional, MaxLength } from 'class-validator';
 
export class SendMessageDto {
  // Optional now: a message can be text-only, media-only (an image/audio/
  // video with no caption), or both.
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  message?: string;
}
 