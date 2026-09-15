import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class WithdrawDto {
  @IsString()
  phone: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;
}
