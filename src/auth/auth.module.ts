import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module'; // Import UserModule
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use JWT_SECRET from environment
      signOptions: { expiresIn: '1h' }, // Token expiry time
    }),
    UserModule, // Make sure UserModule is imported here
  ],
  providers: [JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
