import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  companyId!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  hsn_code?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gst_rate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  purchase_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  selling_price?: number;

  @IsOptional()
  @IsBoolean()
  is_service?: boolean;
}
