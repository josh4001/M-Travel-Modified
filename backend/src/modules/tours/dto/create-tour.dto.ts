import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTourDto {
  @ApiProperty({ description: 'Tour or Circuit title', example: 'Southern Rift Valley & Maasai Mara Circuit' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Tour Category (e.g. DESTINATION, TOUR, HOLIDAY_HOME)', example: 'DESTINATION' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Tour overview or comprehensive description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Price in KES', example: 45000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Tour duration in days', example: 5 })
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiProperty({ required: false, description: 'Optional tour operator profile ID' })
  @IsOptional()
  @IsString()
  operatorId?: string;

  @ApiProperty({ required: false, description: 'Main hero image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false, type: [String], description: 'Gallery image URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ required: false, description: 'Geographic location / corridor' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, description: 'Region (e.g. South Rift, Coast, Central Kenya)' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ required: false, description: 'Promotional badge' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiProperty({ required: false, type: [String], description: 'Feature tags or specifications' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specs?: string[];

  @ApiProperty({ required: false, type: [String], description: 'Key attractions and highlights' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @ApiProperty({ required: false, type: [String], description: 'Day-by-day itinerary route' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scheduleOrItinerary?: string[];
}
