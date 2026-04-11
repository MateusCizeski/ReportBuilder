import { IsString, IsObject, IsOptional } from 'class-validator';

export class SaveContextDto {
  @IsString()
  tableName!: string;

  @IsString()
  description!: string;

  @IsObject()
  @IsOptional()
  columnDescriptions?: Record<string, string>;
}
