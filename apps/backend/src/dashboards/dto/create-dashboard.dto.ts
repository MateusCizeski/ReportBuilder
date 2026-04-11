import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateDashboardDto {
  @IsString()
  name!: string;

  @IsString()
  workspaceId!: string;

  @IsArray()
  @IsOptional()
  items?: any[];

  @IsArray()
  @IsOptional()
  layout?: any[];
}
