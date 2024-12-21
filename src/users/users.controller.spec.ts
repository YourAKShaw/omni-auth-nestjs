import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '@src/users/users.controller';
import { UsersService } from '@src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '@src/users/schemas/users.schema';
import { ApiResponse } from '@src/common/ApiResponse';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test-token'),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            new: jest.fn().mockResolvedValue({}),
            constructor: jest.fn().mockResolvedValue({}),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should create a new user', async () => {
      const mockUser: Partial<User> = {
        email: 'test@test.com',
        username: 'testuser',
      };

      const mockResponse = new ApiResponse<User>(
        'success',
        'successfully created user',
        201,
        mockUser as User,
      );

      jest.spyOn(service, 'signUp').mockResolvedValue(mockResponse);

      const result = await controller.signUp(
        'test@test.com',
        'testuser',
        'password',
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('signIn', () => {
    it('should sign in a user', async () => {
      const mockResponse = new ApiResponse<any>(
        'success',
        'successfully generated access token',
        201,
        { accessToken: 'test-token' },
      );

      jest.spyOn(service, 'signIn').mockResolvedValue(mockResponse);

      const result = await controller.signIn('', 'testuser', 'password');
      expect(result).toBe(mockResponse);
    });
  });
});
