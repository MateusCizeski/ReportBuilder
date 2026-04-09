import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateDashboardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  items?: any[];

  @IsArray()
  @IsOptional()
  layout?: any[];
}
