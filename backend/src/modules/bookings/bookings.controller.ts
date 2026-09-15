import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.userId, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: { userId: string }) {
    return this.bookingsService.findMine(user.userId);
  }

  @Get('owner')
  forOwner(@CurrentUser() user: { userId: string }) {
    return this.bookingsService.findForOwner(user.userId);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.bookingsService.accept(id, user.userId);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.reject(id, user.userId, reason);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancel(id, user.userId, reason);
  }

  /** Tourist removes a PENDING or CANCELLED booking from their list */
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.bookingsService.delete(id, user.userId);
  }

  /** Owner starts a trip (ACCEPTED → IN_PROGRESS) */
  @Patch(':id/start')
  startTrip(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.bookingsService.startTrip(id, user.userId);
  }

  /** Owner completes a trip (IN_PROGRESS → COMPLETED) */
  @Patch(':id/complete')
  completeTrip(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.bookingsService.completeTrip(id, user.userId);
  }
}
