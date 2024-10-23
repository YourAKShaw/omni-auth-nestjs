import { NestFactory } from '@nestjs/core';
import { AppModule } from '@src/app.module';
import { ConfigService } from '@nestjs/config';
import CustomLogger from '@src/common/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Retrieve ConfigService and CustomLogger from the application context
  const configService = app.get(ConfigService);
  const logger = app.get(CustomLogger);

  // Correctly set the context to 'Bootstrap' for logging purposes
  logger.setContext('Bootstrap');

  // Retrieve the port from ConfigService, fallback to 3000 if not defined
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  // Log the startup information with context
  logger.logWithContext('success', `Application is running on port ${port}`);
}

bootstrap();
