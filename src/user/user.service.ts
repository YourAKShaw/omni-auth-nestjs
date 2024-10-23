import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt'; // Import JwtService
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { ApiResponse } from 'src/common/ApiResponse';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService, // Inject JwtService
  ) {}

  async signUp(
    email: string,
    username: string,
    password: string,
  ): Promise<ApiResponse<User>> {
    // Check if the user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
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
    user.save();

    const data = { username: user.username, email: user.email };
    const apiResponse = new ApiResponse<any>(
      'success',
      'successfully created user',
      201,
      data,
    );

    return apiResponse;
  }

  async signIn(username: string, password: string): Promise<ApiResponse<any>> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const payload = { username: user.username, sub: user._id };
    const accessToken = this.jwtService.sign(payload);

    const apiResponse = new ApiResponse<any>(
      'success',
      'successfully generated accessToken',
      201,
      accessToken,
    );

    return apiResponse;
  }
}
