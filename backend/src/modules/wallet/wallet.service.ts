import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getMyWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  // Records a payout to a provider's wallet after a booking completes.
  // Real money movement happens in the payments module; this just keeps the ledger.
  async credit(userId: string, amount: number, type: TransactionType, description?: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    return this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount,
          status: TransactionStatus.COMPLETED,
          description,
        },
      }),
    ]);
  }

  async requestWithdrawal(userId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient wallet balance for this withdrawal');
    }

    return this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.WITHDRAWAL,
          amount,
          status: TransactionStatus.PENDING, // settled once the payout provider confirms
          description: 'Withdrawal request',
        },
      }),
    ]);
    // TODO: trigger actual payout via M-Pesa B2C / Stripe Payout / PayPal Payout.
  }
}
