import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StkPushDto, TopUpDto } from './dto/stk-push.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mpesa/stk-push')
  @HttpCode(HttpStatus.OK)
  async stkPush(@Req() req: any, @Body() dto: StkPushDto) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (dto.bookingId && userId) {
      try {
        return await this.paymentsService.initiateBookingPayment(userId, dto.bookingId, dto.phone, dto.amount);
      } catch {
        // Fallback to direct STK push if booking record is mock or outside DB
        return await this.paymentsService.initiateDirectStkPush(dto.phone, dto.amount, dto.accountReference || dto.bookingId);
      }
    }
    return this.paymentsService.initiateDirectStkPush(dto.phone, dto.amount, dto.accountReference || dto.bookingId);
  }

  // Webhook for M-Pesa, public endpoint
  @Post('mpesa/callback')
  @HttpCode(HttpStatus.OK)
  async mpesaCallback(@Body() body: any) {
    await this.paymentsService.handleMpesaCallback(body);
    // M-Pesa expects a simple success response
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mpesa/withdraw')
  @HttpCode(HttpStatus.OK)
  async withdraw(@Req() req: any, @Body() dto: WithdrawDto) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    return this.paymentsService.initiateWithdrawal(userId, dto.phone, dto.amount);
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallet/topup')
  @HttpCode(HttpStatus.OK)
  async topup(@Req() req: any, @Body() dto: TopUpDto) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    return this.paymentsService.topUpWallet(userId, dto.phone, dto.amount);
  }
}
