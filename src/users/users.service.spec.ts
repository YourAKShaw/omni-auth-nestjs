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
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.email).toBe(mockNewUser.email);
      }
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('should handle case-insensitive username comparison', async () => {
      const mockNewUser = {
        email: 'test@example.com',
        username: 'TestUser',
        password: 'password123',
        _id: 'someId',
      };

      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);

      await expect(
        service.signUp(
          mockNewUser.email,
          mockNewUser.username,
          mockNewUser.password,
        ),
      ).rejects.toThrow('username already exists');

      expect(model.findOne).toHaveBeenCalledWith({
        username: { $regex: new RegExp('^TestUser$', 'i') },
      });
    });

    // ... rest of your test cases remain the same ...
  });

  describe('signIn', () => {
    it('should sign in successfully with case-insensitive email', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.signIn(
        'TEST@example.com',
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

    // ... rest of your test cases remain the same ...
  });
});
