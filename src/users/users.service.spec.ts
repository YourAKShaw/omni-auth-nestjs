import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '@src/users/schemas/users.schema';
import { Model } from 'mongoose';
import { ApiResponse } from '@src/common/ApiResponse';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UserService', () => {
  let service: UsersService;
  let model: Model<User>;
  let jwtService: JwtService;

  const mockUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    _id: 'someId',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test-token'),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<User>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should create a new user successfully with email and username', async () => {
      const mockNewUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        _id: 'someId',
      };

      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'create').mockResolvedValueOnce(mockNewUser as any);

      const result = await service.signUp(
        mockNewUser.email,
        mockNewUser.username,
        mockNewUser.password,
      );

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.status).toBe('success');
      expect(result.statusCode).toBe(201);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.email).toBe(mockNewUser.email);
      }
    });

    it('should create a new user successfully with only username', async () => {
      const mockNewUser = {
        email: 'testuser@optional.com',
        username: 'testuser',
        password: 'password123',
        _id: 'someId',
      };

      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'create').mockResolvedValueOnce(mockNewUser as any);

      const result = await service.signUp(
        '',
        mockNewUser.username,
        mockNewUser.password,
      );

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.status).toBe('success');
      expect(result.statusCode).toBe(201);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.email).toBe('testuser@optional.com');
      }
    });

    it('should create a new user successfully with only email', async () => {
      const mockNewUser = {
        email: 'test@example.com',
        username: 'test',
        password: 'password123',
        _id: 'someId',
      };

      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'create').mockResolvedValueOnce(mockNewUser as any);

      const result = await service.signUp(
        mockNewUser.email,
        '',
        mockNewUser.password,
      );

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.status).toBe('success');
      expect(result.statusCode).toBe(201);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.username).toBe('test');
      }
    });

    it('should throw ConflictException if email exists', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);

      await expect(
        service.signUp('test@example.com', 'testuser', 'password123'),
      ).rejects.toThrow('email already exists');
    });

    it('should throw ConflictException if username exists', async () => {
      jest
        .spyOn(model, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser as any);

      await expect(
        service.signUp('new@example.com', 'testuser', 'password123'),
      ).rejects.toThrow('username already exists');
    });
  });

  describe('signIn', () => {
    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockReset();
    });

    it('should sign in successfully with email', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.signIn(
        'test@example.com',
        '',
        'password123',
      );

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.accessToken).toBe('test-token');
      }
    });

    it('should sign in successfully with username', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.signIn('', 'testuser', 'password123');

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.accessToken).toBe('test-token');
      }
    });

    it('should throw UnauthorizedException if user not found with email', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.signIn('nonexistent@example.com', '', 'password123'),
      ).rejects.toThrow('username not found');
    });

    it('should throw UnauthorizedException if user not found with username', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.signIn('', 'nonexistentuser', 'password123'),
      ).rejects.toThrow('username not found');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.signIn('test@example.com', '', 'wrongpassword'),
      ).rejects.toThrow('invalid password');
    });
  });
});
