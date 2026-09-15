import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StkPushDto {
  @IsString()
  phone: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @IsString()
  accountReference?: string;
}

export class TopUpDto {
  @IsString()
  phone: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;
}
