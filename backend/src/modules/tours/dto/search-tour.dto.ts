import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchTourDto {
  @ApiProperty({ required: false, description: 'Search term for title, description, or location' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filter by category (e.g. DESTINATION, TOUR)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, description: 'Filter by Kenyan region (e.g. South Rift, Coast)' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ required: false, description: 'Minimum price in KES' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiProperty({ required: false, description: 'Maximum price in KES' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;
}
