import { Test, TestingModule } from '@nestjs/testing';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';

describe('TwilioController', () => {
  let controller: TwilioController;

  const mockTwilioService = {
    sendMessage: jest.fn(), // Add any mocked methods here
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwilioController],
      providers: [
        {
          provide: TwilioService,
          useValue: mockTwilioService, // Mock the service
        },
      ],
    }).compile();

    controller = module.get<TwilioController>(TwilioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
