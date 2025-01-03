import { Module } from '@nestjs/common';
import { AppController } from '@src/app.controller';
import { AppService } from '@src/app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '@src/users/users.module';
import { configValidationSchema } from '@src/config/config.validation';
import { AuthModule } from '@src/auth/auth.module';
import CustomLogger from '@src/common/logger';
import { TwilioModule } from '@src/twilio/twilio.module';

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
    TwilioModule,
    UsersModule,
    AuthModule,
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
