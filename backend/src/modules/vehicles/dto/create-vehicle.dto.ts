import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { VehicleType, FuelType, TransmissionType } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) type: VehicleType;
  @ApiProperty() @IsString() make: string;
  @ApiProperty() @IsString() model: string;
  @ApiProperty() @IsInt() @Min(1980) @Max(2100) year: number;
  @ApiProperty() @IsInt() @Min(1) seats: number;
  @ApiProperty({ enum: FuelType }) @IsEnum(FuelType) fuelType: FuelType;
  @ApiProperty({ enum: TransmissionType }) @IsEnum(TransmissionType) transmission: TransmissionType;
  @ApiProperty() @IsNumber() pricePerDay: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() pricePerKm?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() hasInsurance?: boolean;
  @ApiProperty() @IsNumber() latitude: number;
  @ApiProperty() @IsNumber() longitude: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address?: string;
}
