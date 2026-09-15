import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking || booking.userId !== authorId) {
      throw new BadRequestException('You can only review your own completed bookings');
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Only completed bookings can be reviewed');
    }

    const review = await this.prisma.review.create({
      data: {
        authorId,
        vehicleId: dto.vehicleId,
        bookingId: dto.bookingId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    await this.recalculateVehicleRating(dto.vehicleId);
    return review;
  }

  private async recalculateVehicleRating(vehicleId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { vehicleId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ratingAverage: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });
  }

  async forVehicle(vehicleId: string) {
    return this.prisma.review.findMany({
      where: { vehicleId },
      include: { author: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
