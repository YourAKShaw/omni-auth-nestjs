import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '@src/users/schemas/users.schema';
import * as bcrypt from 'bcrypt';
import { ApiResponse } from '@src/common/ApiResponse';
import CustomLogger from '@src/common/logger';
import { Twilio } from 'twilio';
import { TwilioConfig } from '@src/config/twilio.config';

@Injectable()
export class UsersService {
  private readonly logger: any;
  private readonly twilioClient: Twilio;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {
    this.logger = new CustomLogger(UsersService.name).getLogger();
    this.twilioClient = new Twilio(
      TwilioConfig.accountSid,
      TwilioConfig.authToken,
    );
  }

  async signUp(
    email: string,
    username: string,
    password: string,
  ): Promise<ApiResponse<User>> {
    const sanitizedEmail = email || `${username.toLowerCase()}@optional.com`;
    const sanitizedUsername = username || sanitizedEmail.split('@')[0];
    await this.checkUserExists(sanitizedEmail, sanitizedUsername);

    const hashedPassword = await this.hashPassword(password);
    const user = await this.createUser(
      sanitizedEmail,
      sanitizedUsername,
      hashedPassword,
    );

    await this.sendVerificationEmail(user.email);

    return this.createApiResponse('successfully created user', {
      username: user.username,
      email: user.email,
      userId: user._id,
    });
  }

  private async sendVerificationEmail(email: string): Promise<void> {
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

  async signIn(
    email: string,
    username: string,
    password: string,
  ): Promise<ApiResponse<any>> {
    const user = await this.findUser(email, username);
    await this.validatePassword(password, user.password);

    const accessToken = this.generateAccessToken(user);
    return this.createApiResponse('successfully generated access token', {
      accessToken,
    });
  }

  private async checkUserExists(
    email: string,
    username: string,
  ): Promise<void> {
    const emailExists = await this.userModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
    });
    if (emailExists) throw new ConflictException('email already exists');

    const usernameExists = await this.userModel.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    });
    if (usernameExists) throw new ConflictException('username already exists');
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  private async createUser(
    email: string,
    username: string,
    hashedPassword: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.create({
      email,
      username,
      password: hashedPassword,
    });
    this.logger.success(`user with id ${user._id} created successfully`);
    return user;
  }

  private async findUser(
    email: string,
    username: string,
  ): Promise<UserDocument> {
    const query = email
      ? { email: { $regex: new RegExp(`^${email}$`, 'i') } }
      : { username: { $regex: new RegExp(`^${username}$`, 'i') } };
    const user = await this.userModel.findOne(query);
    if (!user) throw new UnauthorizedException('user not found');
    return user;
  }

  private async validatePassword(
    plainText: string,
    hashedPassword: string,
  ): Promise<void> {
    const isValid = await bcrypt.compare(plainText, hashedPassword);
    if (!isValid) throw new UnauthorizedException('invalid password');
  }

  private generateAccessToken(user: UserDocument): string {
    const payload = {
      email: user.email,
      username: user.username,
      sub: user._id,
    };
    const accessToken = this.jwtService.sign(payload);
    this.logger.success(`accessToken for user with id ${user._id} generated`);
    return accessToken;
  }

  private createApiResponse(message: string, data: any): ApiResponse<any> {
    return new ApiResponse<any>('success', message, 201, data);
  }
}
