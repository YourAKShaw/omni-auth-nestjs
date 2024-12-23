import { Module } from '@nestjs/common';
import { TwilioController } from '@src/twilio/twilio.controller';
import { TwilioService } from '@src/twilio/twilio.service';

@Module({
  controllers: [TwilioController],
  providers: [TwilioService],
  exports: [TwilioService], // Export if used in other modules
})
export class TwilioModule {}
