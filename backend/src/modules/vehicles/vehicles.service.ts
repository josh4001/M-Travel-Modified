import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { SearchVehicleDto } from './dto/search-vehicle.dto';

// Haversine formula: great-circle distance between two lat/lng points, in km.
// Used for "nearby vehicles" search until PostGIS is introduced.
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data: { ...dto, ownerId } });
  }

  async search(query: SearchVehicleDto) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        isAvailable: true,
        ...(query.type && { type: query.type }),
        ...((query.minPrice || query.maxPrice) && {
          pricePerDay: {
            ...(query.minPrice && { gte: query.minPrice }),
            ...(query.maxPrice && { lte: query.maxPrice }),
          },
        }),
      },
      include: { images: true, owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { ratingAverage: 'desc' },
    });

    if (query.lat !== undefined && query.lng !== undefined) {
      const radius = query.radiusKm ?? 10;
      return vehicles
        .map((v) => ({ ...v, distanceKm: distanceKm(query.lat!, query.lng!, v.latitude, v.longitude) }))
        .filter((v) => v.distanceKm <= radius)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return vehicles;
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        images: true,
        owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
        reviews: { include: { author: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async update(id: string, ownerId: string, data: Partial<CreateVehicleDto>) {
    await this.assertOwner(id, ownerId);
    return this.prisma.vehicle.update({ where: { id }, data });
  }

  async remove(id: string, ownerId: string) {
    await this.assertOwner(id, ownerId);
    return this.prisma.vehicle.delete({ where: { id } });
  }

  async myVehicles(ownerId: string) {
    return this.prisma.vehicle.findMany({ where: { ownerId }, include: { images: true } });
  }

  /** Look up a vehicle by its plate number and return last known GPS position */
  async findByPlate(plateNumber: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plateNumber: plateNumber.toUpperCase().replace(/\s/g, '') },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        images: true,
        alerts: { where: { isResolved: false }, orderBy: { reportedAt: 'desc' }, take: 1 },
      },
    });
    if (!vehicle) throw new NotFoundException(`No vehicle found with plate "${plateNumber}"`);
    return {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      type: vehicle.type,
      isStolen: vehicle.isStolen,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      lastSeenAt: vehicle.updatedAt,
      owner: vehicle.owner,
      activeAlert: vehicle.alerts[0] ?? null,
      googleMapsUrl: `https://www.google.com/maps?q=${vehicle.latitude},${vehicle.longitude}`,
    };
  }

  /** Flag a vehicle as stolen/missing — admin only */
  async flagStolen(vehicleId: string, description?: string) {
    await this.prisma.vehicle.update({ where: { id: vehicleId }, data: { isStolen: true } });
    return this.prisma.vehicleAlert.create({
      data: { vehicleId, type: 'STOLEN', description: description ?? 'Reported stolen by vehicle owner.' },
    });
  }

  /** Mark a stolen vehicle as recovered */
  async resolveStolen(vehicleId: string) {
    await this.prisma.vehicle.update({ where: { id: vehicleId }, data: { isStolen: false } });
    return this.prisma.vehicleAlert.updateMany({
      where: { vehicleId, isResolved: false },
      data: { isResolved: true, resolvedAt: new Date(), type: 'RECOVERED' },
    });
  }

  async updateTelemetry(vehicleId: string, latitude: number, longitude: number) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { latitude, longitude },
    });
  }

  private async assertOwner(vehicleId: string, ownerId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.ownerId !== ownerId) throw new ForbiddenException('You do not own this vehicle');
    return vehicle;
  }
}
