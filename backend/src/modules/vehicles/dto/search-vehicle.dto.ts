import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class SearchVehicleDto {
  @ApiPropertyOptional({ enum: VehicleType }) @IsOptional() @IsEnum(VehicleType) type?: VehicleType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() minPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;
  @ApiPropertyOptional({ description: 'Search center latitude, used with lng + radiusKm' })
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
  @ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsNumber() radiusKm?: number;
}
