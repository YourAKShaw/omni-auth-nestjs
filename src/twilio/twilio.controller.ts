import { Body, Controller, Post } from '@nestjs/common';
import { TwilioService } from './twilio.service';

@Controller('twilio')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post('verify-email')
  async verifyEmail(@Body('email') email: string) {
    return this.twilioService.sendVerificationEmail(email);
  }
}
