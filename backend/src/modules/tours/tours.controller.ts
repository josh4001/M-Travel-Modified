import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { SearchTourDto } from './dto/search-tour.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('tours')
@Controller('tours')
export class ToursController {
  constructor(private toursService: ToursService) {}

  @Get('circuits')
  @ApiOperation({ summary: 'Get all 10 Official Regional Kenyan Tourist Circuits based on CEO documentation' })
  getCircuits() {
    return this.toursService.getOfficialCircuits();
  }

  @Get()
  @ApiOperation({ summary: 'Search and browse tours, safari packages, and regional circuits' })
  findAll(@Query() query: SearchTourDto) {
    return this.toursService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details for a specific tour or circuit by ID' })
  findOne(@Param('id') id: string) {
    return this.toursService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TOUR_OPERATOR)
  @ApiOperation({ summary: 'Create a new tour or destination package (Admin / Tour Operator)' })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateTourDto) {
    return this.toursService.create(user?.userId || null, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TOUR_OPERATOR)
  @ApiOperation({ summary: 'Update an existing tour or destination package' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateTourDto>) {
    return this.toursService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a tour package (Admin only)' })
  delete(@Param('id') id: string) {
    return this.toursService.delete(id);
  }
}
