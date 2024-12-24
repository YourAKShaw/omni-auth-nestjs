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

  async signUp(signUpDto: {
    email: string;
    username: string;
    countryCode: number;
    phoneNumber: number;
    whatsappCountryCode: number;
    whatsappPhoneNumber: number;
    password: string;
  }): Promise<ApiResponse<User>> {
    this.validatePhoneNumber(signUpDto.countryCode, signUpDto.phoneNumber);
    this.validatePhoneNumber(
      signUpDto.whatsappCountryCode,
      signUpDto.whatsappPhoneNumber,
    );

    const sanitizedEmail = this.sanitizeEmail(signUpDto);
    const sanitizedUsername = this.sanitizeUsername(signUpDto, sanitizedEmail);

    await this.checkUserExists({
      ...signUpDto,
      email: sanitizedEmail,
      username: sanitizedUsername,
    });

    const hashedPassword = await this.hashPassword(signUpDto.password);
    const user = await this.createUser({
      ...signUpDto,
      email: sanitizedEmail,
      username: sanitizedUsername,
      hashedPassword,
    });

    return this.createApiResponse('successfully created user', {
      ...user.toObject(),
      userId: user._id,
    });
  }

  async signIn(signInDto: {
    email?: string;
    username?: string;
    countryCode?: number;
    phoneNumber?: number;
    whatsappCountryCode?: number;
    whatsappPhoneNumber?: number;
    password: string;
  }): Promise<ApiResponse<any>> {
    const user = await this.findUserForSignIn(signInDto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.validatePassword(signInDto.password, user.password);
    const accessToken = this.generateAccessToken(user as UserDocument);

    return this.createApiResponse('successfully generated access token', {
      accessToken,
    });
  }

  async checkUserExists({
    email,
    username,
    countryCode,
    phoneNumber,
    whatsappCountryCode,
    whatsappPhoneNumber,
  }: {
    email: string;
    username: string;
    countryCode: number;
    phoneNumber: number;
    whatsappCountryCode: number;
    whatsappPhoneNumber: number;
  }): Promise<void> {
    await this.checkIfEmailExists(email);
    await this.checkIfUsernameExists(username);
    await this.checkIfPhoneNumberExists(countryCode, phoneNumber);
    await this.checkIfWhatsappPhoneNumberExists(
      whatsappCountryCode,
      whatsappPhoneNumber,
    );
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
    whatsappCountryCode,
    whatsappPhoneNumber,
    hashedPassword,
  }: {
    email: string;
    username: string;
    countryCode: number;
    phoneNumber: number;
    whatsappCountryCode: number;
    whatsappPhoneNumber: number;
    hashedPassword: string;
  }): Promise<UserDocument> {
    const user = await this.userModel.create({
      email,
      username,
      password: hashedPassword,
      countryCode,
      phoneNumber,
      whatsappCountryCode,
      whatsappPhoneNumber,
    });
    this.logger.success(`user with id ${user._id} created successfully`);
    return user;
  }

  private async findUserForSignIn({
    email,
    username,
    countryCode,
    phoneNumber,
    whatsappCountryCode,
    whatsappPhoneNumber,
  }: {
    email?: string;
    username?: string;
    countryCode?: number;
    phoneNumber?: number;
    whatsappCountryCode?: number;
    whatsappPhoneNumber?: number;
  }): Promise<UserDocument | null> {
    if (countryCode && phoneNumber) {
      this.validatePhoneNumber(countryCode, phoneNumber);
      return this.userModel.findOne({ countryCode, phoneNumber });
    }
    if (whatsappCountryCode && whatsappPhoneNumber) {
      this.validatePhoneNumber(whatsappCountryCode, whatsappPhoneNumber);
      return this.userModel.findOne({
        whatsappCountryCode,
        whatsappPhoneNumber,
      });
    }
    if (email) {
      return this.userModel.findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') },
      });
    }
    if (username) {
      return this.userModel.findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
      });
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  private async checkIfEmailExists(email: string): Promise<void> {
    const emailExists = await this.userModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
    });
    if (emailExists) throw new ConflictException('email already exists');
  }

  private async checkIfUsernameExists(username: string): Promise<void> {
    const usernameExists = await this.userModel.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    });
    if (usernameExists) throw new ConflictException('username already exists');
  }

  private async checkIfPhoneNumberExists(
    countryCode: number,
    phoneNumber: number,
  ): Promise<void> {
    if (countryCode && phoneNumber) {
      const phoneExists = await this.userModel.findOne({
        countryCode,
        phoneNumber,
      });
      if (phoneExists)
        throw new ConflictException('phone number already exists');
    }
  }

  private async checkIfWhatsappPhoneNumberExists(
    whatsappCountryCode: number,
    whatsappPhoneNumber: number,
  ): Promise<void> {
    if (whatsappCountryCode && whatsappPhoneNumber) {
      const whatsappPhoneExists = await this.userModel.findOne({
        whatsappCountryCode,
        whatsappPhoneNumber,
      });
      if (whatsappPhoneExists)
        throw new ConflictException('whatsapp phone number already exists');

      const whatsappPhoneExistsAsPhone = await this.userModel.findOne({
        countryCode: whatsappCountryCode,
        phoneNumber: whatsappPhoneNumber,
      });
      if (whatsappPhoneExistsAsPhone)
        throw new ConflictException(
          'whatsapp phone number already exists as phone number',
        );
    }
  }

  private sanitizeEmail({
    email,
    username,
    countryCode,
    phoneNumber,
    whatsappCountryCode,
    whatsappPhoneNumber,
  }: {
    email: string;
    username: string;
    countryCode: number;
    phoneNumber: number;
    whatsappCountryCode: number;
    whatsappPhoneNumber: number;
  }): string {
    let sanitizedEmail = email?.toLowerCase();
    if (!email) {
      if (username) {
        sanitizedEmail = `${username.toLowerCase()}@optional.com`;
      } else if (countryCode && phoneNumber) {
        sanitizedEmail = `${countryCode}${phoneNumber}@optional.com`;
      } else if (whatsappCountryCode && whatsappPhoneNumber) {
        sanitizedEmail = `${whatsappCountryCode}${whatsappPhoneNumber}@whatsapp.com`;
      }
    }
    return sanitizedEmail;
  }

  private sanitizeUsername(
    {
      username,
      email,
      countryCode,
      phoneNumber,
      whatsappCountryCode,
      whatsappPhoneNumber,
    }: any,
    sanitizedEmail: string,
  ): string {
    let sanitizedUsername = username;
    if (!username) {
      if (email) {
        sanitizedUsername = sanitizedEmail.split('@')[0];
      } else if (countryCode && phoneNumber) {
        sanitizedUsername = `${countryCode}${phoneNumber}`;
      } else if (whatsappCountryCode && whatsappPhoneNumber) {
        sanitizedUsername = `${whatsappCountryCode}${whatsappPhoneNumber}@whatsapp`;
      }
    }
    return sanitizedUsername;
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

  private validatePhoneNumber(countryCode: number, phoneNumber: number): void {
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
  }
}
