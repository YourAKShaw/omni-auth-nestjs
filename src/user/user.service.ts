import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { ApiResponse } from 'src/common/ApiResponse';
import CustomLogger from 'src/common/logger'; // Import CustomLogger

@Injectable()
export class UserService {
  private readonly logger: any;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {
    this.logger = new CustomLogger(UserService.name).getLogger();
  }

  async signUp(
    email: string,
    username: string,
    password: string,
  ): Promise<ApiResponse<User>> {
    // Check if the user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      this.logger.error('email already exists');
      throw new ConflictException('email already exists');
    }

    const existingUserByUsername = await this.userModel.findOne({ username });
    if (existingUserByUsername) {
      this.logger.error('username already exists');
      throw new ConflictException('username already exists');
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the new user
    const user = new this.userModel({
      email,
      username,
      password: hashedPassword,
    });
    await user.save(); // Ensure await to save user properly

    this.logger.success(`user with id ${user._id} created successfully`);

    const data = {
      username: user.username,
      email: user.email,
      userId: user._id,
    };
    const apiResponse = new ApiResponse<any>(
      'success',
      'Successfully created user',
      201,
      data,
    );

    return apiResponse;
  }

  async signIn(username: string, password: string): Promise<ApiResponse<any>> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      this.logger.error('username not found');
      throw new UnauthorizedException('username not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.error('invalid password');
      throw new UnauthorizedException('invalid password');
    }

    // Generate JWT
    const payload = { username: user.username, sub: user._id };
    const accessToken = this.jwtService.sign(payload);

    this.logger.success(`accessToken for user with id ${user._id} generated`);
    const apiResponse = new ApiResponse<any>(
      'success',
      'Successfully generated access token',
      201,
      { accessToken },
    );

    return apiResponse;
  }
}
