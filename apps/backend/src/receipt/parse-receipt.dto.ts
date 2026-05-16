import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReceiptItemDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  price!: number;
}

export class ReceiptServiceChargeDto {
  @IsBoolean()
  present!: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  percent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}

export class ParseReceiptResponseDto {
  @IsString()
  currency!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  items!: ReceiptItemDto[];

  @IsNumber()
  @Min(0)
  receiptTotal!: number;

  @ValidateNested()
  @Type(() => ReceiptServiceChargeDto)
  serviceCharge!: ReceiptServiceChargeDto;
}
