import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
