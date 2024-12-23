import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '@src/users/schemas/users.schema';
import * as bcrypt from 'bcrypt';
import { ApiResponse } from '@src/common/ApiResponse';
import CustomLogger from '@src/common/logger';
import validatePhoneNumber from '@src/utils/validatePhoneNumber';

@Injectable()
export class UsersService {
  private readonly logger: any;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {
    this.logger = new CustomLogger(UsersService.name).getLogger();
  }

  async signUp({
    email,
    username,
    countryCode,
    phoneNumber,
    password,
  }: {
    email: string;
    username: string;
    countryCode: number;
    phoneNumber: number;
    password: string;
  }): Promise<ApiResponse<User>> {
    if (countryCode && phoneNumber) {
      const validationResult = validatePhoneNumber({
        countryCode,
        phoneNumber,
      });
      if (!validationResult.isValid) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Invalid countryCode and/or phoneNumber provided',
          error: 'Bad Request',
        });
      }
    }

    let sanitizedEmail = email?.toLowerCase();
    if (!email) {
      if (username) {
        sanitizedEmail = `${username.toLowerCase()}@optional.com`;
      } else if (countryCode && phoneNumber) {
        sanitizedEmail = `${countryCode}${phoneNumber}@optional.com`;
      }
    }

    let sanitizedUsername = username;
    if (!username) {
      if (email) {
        sanitizedUsername = sanitizedEmail.split('@')[0];
      } else if (countryCode && phoneNumber) {
        sanitizedUsername = `${countryCode}${phoneNumber}`;
      }
    }

    await this.checkUserExists({
      email: sanitizedEmail,
      username: sanitizedUsername,
      countryCode,
      phoneNumber,
    });

    const hashedPassword = await this.hashPassword(password);
    const user = await this.createUser({
      email: sanitizedEmail,
      username: sanitizedUsername,
      countryCode,
      phoneNumber,
      hashedPassword,
    });

    return this.createApiResponse('successfully created user', {
      username: user.username,
      email: user.email,
      countryCode: user.countryCode,
      phoneNumber: user.phoneNumber,
      userId: user._id,
    });
  }

  async signIn({
    email,
    username,
    countryCode,
    phoneNumber,
    password,
  }: {
    email?: string;
    username?: string;
    countryCode?: number;
    phoneNumber?: number;
    password: string;
  }): Promise<ApiResponse<any>> {
    let user: UserDocument | null = null;

    // Validate input and prioritize countryCode/phoneNumber if provided
    if (countryCode && phoneNumber) {
      const validationResult = validatePhoneNumber({
        countryCode,
        phoneNumber,
      });
      if (!validationResult.isValid) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Invalid countryCode and/or phoneNumber provided',
          error: 'Bad Request',
        });
      }

      user = await this.userModel.findOne({
        countryCode,
        phoneNumber,
      });
    } else if (email) {
      user = await this.userModel.findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') },
      });
    } else if (username) {
      user = await this.userModel.findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    await this.validatePassword(password, user.password);

    // Generate access token
    const accessToken = this.generateAccessToken(user);

    // Return success response
    return this.createApiResponse('successfully generated access token', {
      accessToken,
    });
  }

  async checkUserExists({
    email,
    username,
    countryCode,
    phoneNumber,
  }: {
    email: string;
    username: string;
    countryCode: number;
    phoneNumber: number;
  }): Promise<void> {
    // Check if email exists (case-insensitive)
    const emailExists = await this.userModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
    });
    if (emailExists) throw new ConflictException('email already exists');

    // Check if username exists (case-insensitive)
    const usernameExists = await this.userModel.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    });
    if (usernameExists) throw new ConflictException('username already exists');

    if (countryCode && phoneNumber) {
      // Check if phoneNumber exists
      const phoneExists = await this.userModel.findOne({
        countryCode,
        phoneNumber,
      });
      if (phoneExists)
        throw new ConflictException('phone number already exists');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  private async createUser({
    email,
    username,
    countryCode,
    phoneNumber,
    hashedPassword,
  }: {
    email: string;
    username: string;
    countryCode: number;
    phoneNumber: number;
    hashedPassword: string;
  }): Promise<UserDocument> {
    const user = await this.userModel.create({
      email,
      username,
      password: hashedPassword,
      countryCode,
      phoneNumber,
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

  async validatePassword(
    plainText: string,
    hashedPassword: string,
  ): Promise<void> {
    const isValid = await bcrypt.compare(plainText, hashedPassword);
    if (!isValid) throw new UnauthorizedException('invalid password');
  }

  generateAccessToken(user: UserDocument): string {
    const payload = {
      email: user.email,
      username: user.username,
      sub: user._id,
    };
    const accessToken = this.jwtService.sign(payload);
    this.logger.success(`accessToken for user with id ${user._id} generated`);
    return accessToken;
  }

  createApiResponse(message: string, data: any): ApiResponse<any> {
    return new ApiResponse<any>('success', message, 201, data);
  }
}
