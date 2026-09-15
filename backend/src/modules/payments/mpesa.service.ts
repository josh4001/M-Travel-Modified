import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly env: string;
  private readonly baseUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly shortCode: string;
  private readonly storeNumber: string;
  private readonly tillNumber: string;
  private readonly passkey: string;
  private readonly callbackUrl: string;

  constructor(private configService: ConfigService) {
    this.env = this.configService.get<string>('MPESA_ENV', 'sandbox');
    this.baseUrl = this.env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    this.consumerKey = this.configService.get<string>(
      'MPESA_CONSUMER_KEY',
      'UzCHPAOvzWbAScGlUzpXVGMkFASg3OP1cFKoO8Y9O3OhMHal',
    );
    this.consumerSecret = this.configService.get<string>(
      'MPESA_CONSUMER_SECRET',
      'K5TAaxE6R5cWpYJWTH3XHQcEm7fhF8Mf8M3F7f8JAL5DjXMa7nB3oQkx5GlOJAWo',
    );
    
    // Store Number (Head Office Shortcode used as BusinessShortCode for STK Push)
    this.storeNumber = this.configService.get<string>(
      'MPESA_STORE_NUMBER',
      this.configService.get<string>('MPESA_SHORTCODE', '174379'),
    );
    
    // Till Number (Buy Goods Till Number used as PartyB)
    this.tillNumber = this.configService.get<string>(
      'MPESA_TILL_NUMBER',
      this.configService.get<string>('MPESA_SHORTCODE', '174379'),
    );

    this.shortCode = this.storeNumber;
    this.passkey = this.configService.get<string>(
      'MPESA_PASSKEY',
      'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    );
    this.callbackUrl = this.configService.get<string>(
      'MPESA_CALLBACK_URL',
      'https://m-travel.co.ke/api/v1/payments/mpesa/callback',
    );
  }

  /**
   * Fetch OAuth 2.0 Token from Safaricom Daraja API
   */
  async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Auth HTTP error: ${response.status}`);
      }

      const data: any = await response.json();
      return data.access_token;
    } catch (error: any) {
      this.logger.error('Failed to get M-Pesa access token', error?.message || error);
      throw new InternalServerErrorException('Payment gateway authentication failed');
    }
  }

  private generatePassword(shortCode: string, passkey: string, timestamp: string): string {
    return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
  }

  private getTimestamp(): string {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
  }

  /**
   * Lipa Na M-Pesa Online (STK Push)
   * Supports both Buy Goods (Till Number) and Paybill transactions.
   * In Sandbox mode, uses Daraja Test Shortcode 174379 to ensure physical phones receive the prompt.
   */
  async stkPush(phone: string, amount: number, accountReference: string) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();

    const isProduction = this.env === 'production';
    const isBuyGoods = isProduction && Boolean(this.tillNumber && this.tillNumber !== this.storeNumber);

    const businessShortCode = isProduction ? this.storeNumber : '174379';
    const passkey = isProduction ? this.passkey : 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const partyB = isProduction ? (isBuyGoods ? this.tillNumber : this.storeNumber) : '174379';
    const transactionType = isBuyGoods ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';

    const password = this.generatePassword(businessShortCode, passkey, timestamp);

    // Format phone to 254XXXXXXXXX
    let formattedPhone = phone.trim().replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.slice(1)}`;
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1);
    }

    const payload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: partyB,
      PhoneNumber: formattedPhone,
      CallBackURL: this.callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: `M-TRAVEL Payment ${accountReference}`,
    };

    this.logger.log(
      `Initiating ${payload.TransactionType} STK Push to ${formattedPhone} for KES ${payload.Amount} via Shortcode ${businessShortCode} (Env: ${this.env})`,
    );

    try {
      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();
      return data;
    } catch (error: any) {
      this.logger.error('STK push failed', error?.message || error);
      throw new InternalServerErrorException('Failed to initiate M-Pesa STK push');
    }
  }

  /**
   * B2C Payout (Wallet Withdrawals to Owner/Partner)
   */
  async b2cPayout(phone: string, amount: number) {
    const token = await this.getAccessToken();

    let formattedPhone = phone.trim().replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.slice(1)}`;
    }

    const payload = {
      InitiatorName: this.configService.get<string>('MPESA_INITIATOR_NAME', 'testapi'),
      SecurityCredential: this.configService.get<string>('MPESA_SECURITY_CREDENTIAL', 'test'),
      CommandID: 'BusinessPayment',
      Amount: Math.round(amount),
      PartyA: this.shortCode,
      PartyB: formattedPhone,
      Remarks: 'M-TRAVEL Wallet Withdrawal',
      QueueTimeOutURL: `${this.callbackUrl}/timeout`,
      ResultURL: `${this.callbackUrl}/result`,
      Occasion: 'Withdrawal',
    };

    try {
      const response = await fetch(`${this.baseUrl}/mpesa/b2c/v1/paymentrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();
      return data;
    } catch (error: any) {
      this.logger.error('B2C Payout failed', error?.message || error);
      throw new InternalServerErrorException('Failed to process M-Pesa payout');
    }
  }
}
