import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('me')
  myWallet(@CurrentUser() user: { userId: string }) {
    return this.walletService.getMyWallet(user.userId);
  }

  @Post('withdraw')
  withdraw(@CurrentUser() user: { userId: string }, @Body('amount') amount: number) {
    return this.walletService.requestWithdrawal(user.userId, amount);
  }
}
