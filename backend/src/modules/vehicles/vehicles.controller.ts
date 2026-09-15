import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { SearchVehicleDto } from './dto/search-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  // Public: search & view — no auth required to browse the marketplace.
  @Get()
  search(@Query() query: SearchVehicleDto) {
    return this.vehiclesService.search(query);
  }

  /** Locate a vehicle by plate number — admin/owner use for stolen/missing reports */
  @Get('locate/:plate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.VEHICLE_OWNER)
  locateByPlate(@Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VEHICLE_OWNER, Role.ADMIN)
  myVehicles(@CurrentUser() user: { userId: string }) {
    return this.vehiclesService.myVehicles(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VEHICLE_OWNER, Role.ADMIN)
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VEHICLE_OWNER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: Partial<CreateVehicleDto>,
  ) {
    return this.vehiclesService.update(id, user.userId, dto);
  }

  @Post(':id/telemetry')
  updateTelemetry(
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number },
  ) {
    return this.vehiclesService.updateTelemetry(id, body.latitude, body.longitude);
  }

  /** Flag vehicle as stolen — admin only */
  @Post(':id/stolen')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  flagStolen(@Param('id') id: string, @Body() body: { description?: string }) {
    return this.vehiclesService.flagStolen(id, body.description);
  }

  /** Mark stolen vehicle as recovered */
  @Delete(':id/stolen')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  resolveStolen(@Param('id') id: string) {
    return this.vehiclesService.resolveStolen(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VEHICLE_OWNER, Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.vehiclesService.remove(id, user.userId);
  }
}
