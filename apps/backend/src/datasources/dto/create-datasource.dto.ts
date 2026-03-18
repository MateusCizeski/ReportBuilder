import {
  IsString,
  IsIn,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class CreateDatasourceDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsIn(['postgresql', 'mysql', 'mssql'])
  type: 'postgresql' | 'mysql' | 'mssql';

  @IsString()
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  database: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsBoolean()
  @IsOptional()
  useSsl?: boolean;
}
