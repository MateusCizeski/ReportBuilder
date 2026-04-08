import { IsString, IsArray, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateReportDto {
  @IsString()
  name: string;

  @IsString()
  sql: string;

  @IsString()
  datasourceId: string;

  @IsString()
  workspaceId: string;

  @IsArray()
  @IsOptional()
  rows?: Record<string, any>[];

  @IsNumber()
  @IsOptional()
  rowCount?: number;

  @IsNumber()
  @IsOptional()
  executionMs?: number;

  @IsIn(['table', 'bar', 'line', 'pie'])
  @IsOptional()
  visualType?: 'table' | 'bar' | 'line' | 'pie';
}
