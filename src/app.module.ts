import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { configValidationSchema } from './config/config.validation';
import CustomLogger from './common/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      validationSchema: configValidationSchema,
      isGlobal: true, // Make ConfigModule global
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: CustomLogger,
      useClass: CustomLogger, // Use CustomLogger class globally
    },
  ],
  exports: [CustomLogger], // Export it to make it accessible in other modules
})
export class AppModule {}
