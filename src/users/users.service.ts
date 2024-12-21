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

@Injectable()
export class UsersService {
  private readonly logger: any;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {
    this.logger = new CustomLogger(UsersService.name).getLogger();
  }

  async signUp(
    email: string,
    username: string,
    password: string,
  ): Promise<ApiResponse<User>> {
    email = email?.toLowerCase();

    if (!email) {
      email = `${username.toLowerCase()}@optional.com`;
    }

    if (!username) {
      username = email.split('@')[0];
    }

    // Check if the user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      this.logger.error('email already exists');
      throw new ConflictException('email already exists');
    }

    const existingUserByUsername = await this.userModel
      .findOne({
        username,
      })
      .collation({ locale: 'en', strength: 2 })
      .exec();

    if (existingUserByUsername) {
      this.logger.error('username already exists');
      throw new ConflictException('username already exists');
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the new user using create method
    const user = await this.userModel.create({
      email,
      username,
      password: hashedPassword,
    });

    this.logger.success(`user with id ${user._id} created successfully`);

    const data = {
      username: user.username,
      email: user.email,
      userId: user._id,
    };

    const apiResponse = new ApiResponse<any>(
      'success',
      'successfully created user',
      201,
      data,
    );

    return apiResponse;
  }

  async signIn(
    email: string,
    username: string,
    password: string,
  ): Promise<ApiResponse<any>> {
    email = email?.toLowerCase();

    let user = null;
    if (email) {
      user = await this.userModel.findOne({ email });
    } else {
      user = await this.userModel.findOne({ username });
    }
    if (!user) {
      this.logger.error('user not found');
      throw new UnauthorizedException('username not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.error('invalid password');
      throw new UnauthorizedException('invalid password');
    }

    // Generate JWT
    const payload = {
      email: user.email,
      username: user.username,
      sub: user._id,
    };
    const accessToken = this.jwtService.sign(payload);

    this.logger.success(`accessToken for user with id ${user._id} generated`);
    const apiResponse = new ApiResponse<any>(
      'success',
      'successfully generated access token',
      201,
      { accessToken },
    );

    return apiResponse;
  }
}
