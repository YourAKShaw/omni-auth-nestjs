import { Injectable } from '@nestjs/common';
import CustomLogger from '@src/common/logger';
import { TwilioConfig } from '@src/config/twilio.config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger: any;
  private readonly twilioClient: Twilio;

  constructor() {
    this.logger = new CustomLogger(TwilioService.name).getLogger();
    this.twilioClient = new Twilio(
      TwilioConfig.accountSid,
      TwilioConfig.authToken,
    );
  }

  async sendVerificationEmail(email: string): Promise<void> {
    if (!TwilioConfig.verifyServiceSid) {
      throw new Error('Twilio Verify Service SID is not configured');
    }

    try {
      await this.twilioClient.verify.v2
        .services(TwilioConfig.verifyServiceSid)
        .verifications.create({
          to: email,
          channel: 'email',
        });
      this.logger.success(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error}`);
      throw new Error('Could not send verification email');
    }
  }
}
