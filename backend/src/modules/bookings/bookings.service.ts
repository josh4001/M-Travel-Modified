import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

function generateBookingRef() {
  return `MT-${randomBytes(4).toString('hex').toUpperCase()}`;
}

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBookingDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (!vehicle.isAvailable) throw new BadRequestException('This vehicle is not currently available');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) throw new BadRequestException('endDate must be after startDate');

    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const totalAmount = Number(vehicle.pricePerDay) * days;

    return this.prisma.booking.create({
      data: {
        bookingRef: generateBookingRef(),
        userId,
        bookableType: 'VEHICLE',
        vehicleId: vehicle.id,
        startDate: start,
        endDate: end,
        totalAmount,
        status: BookingStatus.PENDING,
      },
      include: { vehicle: true },
    });
  }

  async findMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { vehicle: { include: { images: true } }, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Bookings for vehicles owned by this owner — their "incoming requests" list.
  async findForOwner(ownerId: string) {
    return this.prisma.booking.findMany({
      where: { vehicle: { ownerId } },
      include: { vehicle: true, user: { select: { firstName: true, lastName: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(bookingId: string, ownerId: string) {
    await this.assertOwnerOfBookingVehicle(bookingId, ownerId);
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.ACCEPTED },
    });
  }

  async reject(bookingId: string, ownerId: string, reason?: string) {
    await this.assertOwnerOfBookingVehicle(bookingId, ownerId);
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.REJECTED, cancelReason: reason },
    });
  }

  async cancel(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('This is not your booking');
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('A completed booking cannot be cancelled');
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED, cancelReason: reason },
    });
  }

  /** Soft-delete: tourist can remove a PENDING/CANCELLED booking from their view */
  async delete(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('This is not your booking');
    if (
      booking.status === BookingStatus.IN_PROGRESS ||
      booking.status === BookingStatus.ACCEPTED ||
      booking.status === BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException('Cannot delete an active or confirmed booking — cancel it first');
    }
    // Soft-delete: mark as CANCELLED so it disappears from active view
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED, cancelReason: 'Deleted by user' },
    });
  }

  /** Owner marks a booking as IN_PROGRESS (trip started) */
  async startTrip(bookingId: string, ownerId: string) {
    const booking = await this.assertOwnerOfBookingVehicle(bookingId, ownerId);
    if (booking.status !== BookingStatus.ACCEPTED && booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only accepted or confirmed bookings can be started');
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.IN_PROGRESS },
    });
  }

  /** Owner marks a booking as COMPLETED (trip ended) */
  async completeTrip(bookingId: string, ownerId: string) {
    const booking = await this.assertOwnerOfBookingVehicle(bookingId, ownerId);
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress trips can be marked as completed');
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED },
    });
  }

  private async assertOwnerOfBookingVehicle(bookingId: string, ownerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vehicle: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.vehicle?.ownerId !== ownerId) {
      throw new ForbiddenException('You do not manage this vehicle');
    }
    return booking;
  }
}
