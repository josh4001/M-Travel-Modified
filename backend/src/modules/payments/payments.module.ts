import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MpesaService } from './mpesa.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MpesaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
