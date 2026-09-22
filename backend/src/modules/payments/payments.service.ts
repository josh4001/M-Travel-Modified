import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { MpesaService } from './mpesa.service';
import { BookingStatus, PaymentProvider, PaymentStatus, TransactionStatus, TransactionType } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private mpesaService: MpesaService,
  ) {}

  async initiateDirectStkPush(phone: string, amount: number, accountReference?: string) {
    const ref = accountReference || 'M-TRAVEL';
    return this.mpesaService.stkPush(phone, amount, ref);
  }

  async initiateBookingPayment(userId: string, bookingId: string, phone: string, amount: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId, userId },
      include: { payment: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not in a valid state for payment');
    }
    if (Number(booking.totalAmount) !== amount) {
      throw new BadRequestException('Amount mismatch');
    }

    const response = await this.mpesaService.stkPush(phone, amount, booking.bookingRef);

    // Record pending payment
    if (booking.payment) {
      await this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          providerRef: response.CheckoutRequestID,
          status: PaymentStatus.PENDING,
          amount,
        },
      });
    } else {
      await this.prisma.payment.create({
        data: {
          bookingId,
          provider: PaymentProvider.MPESA,
          amount,
          providerRef: response.CheckoutRequestID,
          status: PaymentStatus.PENDING,
        },
      });
    }

    return response;
  }

  async handleMpesaCallback(body: any) {
    this.logger.log('Received M-Pesa Callback', JSON.stringify(body));
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      throw new BadRequestException('Invalid callback format');
    }

    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;

    const payment = await this.prisma.payment.findFirst({
      where: { providerRef: checkoutRequestID },
      include: { booking: { include: { vehicle: true } } },
    });

    if (!payment) {
      this.logger.error(`Payment not found for CheckoutRequestID: ${checkoutRequestID}`);
      return;
    }

    if (resultCode === 0) {
      // Success
      await this.prisma.$transaction(async (prisma) => {
        // Update payment
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.SUCCEEDED },
        });

        // Update booking if bookingId exists
        if (payment.bookingId) {
          await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: BookingStatus.CONFIRMED },
          });
        }

        // Credit owner's wallet if applicable (for vehicle bookings)
        if (payment.booking?.vehicle) {
          const ownerId = payment.booking.vehicle.ownerId;
          const commissionAmount = Number(payment.amount) * 0.1; // 10% platform fee
          const netAmount = Number(payment.amount) - commissionAmount;

          if (ownerId) {
            const wallet = await prisma.wallet.findUnique({ where: { userId: ownerId } });
            if (wallet) {
              await prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: netAmount } },
              });
              await prisma.transaction.create({
                data: {
                  walletId: wallet.id,
                  type: TransactionType.BOOKING_PAYOUT,
                  amount: netAmount,
                  status: TransactionStatus.COMPLETED,
                  description: `Payout for booking ${payment.booking?.bookingRef || payment.bookingId}`,
                },
              });
            }
          }
        }
      });
    } else {
      // Failed or cancelled
      await this.prisma.$transaction(async (prisma) => {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
        if (payment.bookingId) {
          await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: BookingStatus.CANCELLED },
          });
        }
      });
    }
  }

  async initiateWithdrawal(userId: string, phone: string, amount: number) {
    // Deduct from wallet first (will throw if insufficient balance)
    const tx = await this.walletService.requestWithdrawal(userId, amount);

    // Call M-Pesa B2C
    try {
      const response = await this.mpesaService.b2cPayout(phone, amount);
      
      // Update transaction status
      await this.prisma.transaction.update({
        where: { id: tx[1].id },
        data: {
          status: TransactionStatus.COMPLETED,
          reference: response.ConversationID,
        },
      });

      return { success: true, message: 'Withdrawal processed', reference: response.ConversationID };
    } catch (error) {
      // Refund wallet on failure
      await this.walletService.credit(userId, amount, TransactionType.REFUND, 'Withdrawal failed refund');
      await this.prisma.transaction.update({
        where: { id: tx[1].id },
        data: { status: TransactionStatus.FAILED },
      });
      throw error;
    }
  }

  async topUpWallet(userId: string, phone: string, amount: number) {
    if (!userId) {
      throw new BadRequestException('User authentication required for wallet top-up');
    }

    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }

    const accountRef = `TOPUP-${userId.substring(0, 6)}`;
    const response = await this.mpesaService.stkPush(phone, amount, accountRef);

    // Create a pending transaction for topup
    await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.TOPUP,
        amount,
        status: TransactionStatus.PENDING,
        reference: response.CheckoutRequestID || response.MerchantRequestID || 'PENDING',
        description: 'Wallet Top-Up via M-Pesa',
      },
    });

    return response;
  }
}
