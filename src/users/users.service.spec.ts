import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '@src/users/schemas/users.schema';
import { Model } from 'mongoose';
import { ApiResponse } from '@src/common/ApiResponse';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import validatePhoneNumber from '@src/utils/validatePhoneNumber';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('@src/utils/validatePhoneNumber', () => jest.fn());

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<User>;
  let jwtService: JwtService;

  const mockUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    countryCode: 1,
    phoneNumber: 1234567890,
    whatsappCountryCode: 1,
    whatsappPhoneNumber: 1234567890,
    _id: 'someId',
    toObject: jest.fn().mockReturnValue({
      email: 'test@example.com',
      username: 'testuser',
      countryCode: 1,
      phoneNumber: 1234567890,
      whatsappCountryCode: 1,
      whatsappPhoneNumber: 1234567890,
      _id: 'someId',
    }),
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
    it('should create a new user successfully with all fields', async () => {
      const mockNewUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        countryCode: 1,
        phoneNumber: 1234567890,
        whatsappCountryCode: 1,
        whatsappPhoneNumber: 1234567890,
      };

      jest.spyOn(model, 'findOne').mockResolvedValue(null);
      jest.spyOn(model, 'create').mockResolvedValue(mockUser as any);

      (validatePhoneNumber as jest.Mock).mockReturnValue({ isValid: true });

      const result = await service.signUp(mockNewUser);

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
        countryCode: 1,
        phoneNumber: 1234567890,
        whatsappCountryCode: 1,
        whatsappPhoneNumber: 1234567890,
      };

      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);

      await expect(service.signUp(mockNewUser)).rejects.toThrow(
        'username already exists',
      );

      expect(model.findOne).toHaveBeenCalledWith({
        username: { $regex: new RegExp('^TestUser$', 'i') },
      });
    });

    it('should throw BadRequestException for invalid phone number', async () => {
      const mockNewUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        countryCode: 1,
        phoneNumber: 1234567890,
        whatsappCountryCode: 1,
        whatsappPhoneNumber: 1234567890,
      };

      (validatePhoneNumber as jest.Mock).mockReturnValue({ isValid: false });

      await expect(service.signUp(mockNewUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      const mockNewUser = {
        email: 'test@example.com',
        username: 'testuser',
        countryCode: 0,
        phoneNumber: 0,
        whatsappCountryCode: 0,
        whatsappPhoneNumber: 0,
        password: 'password123',
      };

      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);

      await expect(service.signUp(mockNewUser)).rejects.toThrow(
        'email already exists',
      );
    });
  });

  describe('signIn', () => {
    it('should sign in successfully with case-insensitive email', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.signIn({
        email: 'TEST@example.com',
        password: 'password123',
      });

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.accessToken).toBe('test-token');
      }
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.signIn({
          email: 'TEST@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for invalid phone number', async () => {
      (validatePhoneNumber as jest.Mock).mockReturnValue({ isValid: false });

      await expect(
        service.signIn({
          countryCode: 1,
          phoneNumber: 1234567890,
          password: 'password123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should sign in successfully with phone number', async () => {
      (validatePhoneNumber as jest.Mock).mockReturnValue({ isValid: true });
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.signIn({
        countryCode: 1,
        phoneNumber: 1234567890,
        password: 'password123',
      });

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.accessToken).toBe('test-token');
      }
    });

    it('should sign in successfully with WhatsApp number', async () => {
      (validatePhoneNumber as jest.Mock).mockReturnValue({ isValid: true });
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.signIn({
        whatsappCountryCode: 1,
        whatsappPhoneNumber: 1234567890,
        password: 'password123',
      });

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.accessToken).toBe('test-token');
      }
    });
  });

  describe('checkUserExists', () => {
    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);

      await expect(
        service.checkUserExists({
          email: mockUser.email,
          username: 'newuser',
          countryCode: 1,
          phoneNumber: 1234567890,
          whatsappCountryCode: 1,
          whatsappPhoneNumber: 1234567890,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if username already exists', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);

      await expect(
        service.checkUserExists({
          email: 'new@example.com',
          username: mockUser.username,
          countryCode: 1,
          phoneNumber: 1234567890,
          whatsappCountryCode: 1,
          whatsappPhoneNumber: 1234567890,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if phone number already exists', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);

      await expect(
        service.checkUserExists({
          email: 'new@example.com',
          username: 'newuser',
          countryCode: 1,
          phoneNumber: mockUser.phoneNumber,
          whatsappCountryCode: 1,
          whatsappPhoneNumber: 1234567890,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if WhatsApp phone number already exists', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser as any);

      await expect(
        service.checkUserExists({
          email: 'new@example.com',
          username: 'newuser',
          countryCode: 1,
          phoneNumber: 1234567891,
          whatsappCountryCode: 1,
          whatsappPhoneNumber: mockUser.phoneNumber,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validatePassword', () => {
    it('should throw UnauthorizedException for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.validatePassword('plainTextPassword', 'hashedPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not throw for valid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        service.validatePassword('plainTextPassword', 'hashedPassword'),
      ).resolves.not.toThrow();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate access token', () => {
      const result = service.generateAccessToken(
        mockUser as unknown as UserDocument,
      );

      expect(result).toBe('test-token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        username: mockUser.username,
        sub: mockUser._id,
      });
    });
  });

  describe('createApiResponse', () => {
    it('should create an ApiResponse', () => {
      const message = 'success';
      const data = { key: 'value' };

      const result = service.createApiResponse(message, data);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.status).toBe('success');
      expect(result.statusCode).toBe(201);
      expect(result.data).toBe(data);
    });
  });

  describe('sanitizeEmail', () => {
    it('should sanitize email correctly', () => {
      const signUpDto = {
        email: 'TEST@Example.com',
        username: '',
        countryCode: 1,
        phoneNumber: 1234567890,
        whatsappCountryCode: 1,
        whatsappPhoneNumber: 1234567890,
        password: 'password123',
      };

      const result = service.sanitizeEmail(signUpDto);

      expect(result).toBe('test@example.com');
    });

    it('should generate email from username', () => {
      const signUpDto = {
        email: '',
        username: 'testuser',
        countryCode: 1,
        phoneNumber: 1234567890,
        whatsappCountryCode: 1,
        whatsappPhoneNumber: 1234567890,
        password: 'password123',
      };

      const result = service.sanitizeEmail(signUpDto);

      expect(result).toBe('testuser@optional.com');
    });

    it('should generate email from phone number', () => {
      const signUpDto = {
        email: '',
        username: '',
        countryCode: 1,
        phoneNumber: 1234567890,
        whatsappCountryCode: 0,
        whatsappPhoneNumber: 0,
        password: 'password123',
      };

      const result = service.sanitizeEmail(signUpDto);

      expect(result).toBe('11234567890@optional.com');
    });

    it('should generate email from WhatsApp number', () => {
      const signUpDto = {
        email: '',
        username: '',
        countryCode: 0,
        phoneNumber: 0,
        whatsappCountryCode: 1,
        whatsappPhoneNumber: 1234567890,
        password: 'password123',
      };

      const result = service.sanitizeEmail(signUpDto);

      expect(result).toBe('11234567890@whatsapp.com');
    });
  });

  describe('sanitizeUsername', () => {
    it('should sanitize username correctly', () => {
      const signUpDto = {
        email: 'TEST@Example.com',
        username: 'TestUser',
        countryCode: 1,
        phoneNumber: 1234567890,
        whatsappCountryCode: 1,
        whatsappPhoneNumber: 1234567890,
        password: 'password123',
      };

      const sanitizedEmail = 'test@example.com';
      const result = service.sanitizeUsername(signUpDto, sanitizedEmail);

      expect(result).toBe('TestUser');
    });

    it('should generate username from email', () => {
      const signUpDto = {
        email: 'test@example.com',
        username: '',
        countryCode: 1,
        phoneNumber: 1234567890,
        whatsappCountryCode: 1,
        whatsappPhoneNumber: 1234567890,
        password: 'password123',
      };

      const sanitizedEmail = 'test@example.com';
      const result = service.sanitizeUsername(signUpDto, sanitizedEmail);

      expect(result).toBe('test');
    });

    it('should generate username from phone number', () => {
      const signUpDto = {
        email: '',
        username: '',
        countryCode: 1,
        phoneNumber: 1234567890,
        whatsappCountryCode: 0,
        whatsappPhoneNumber: 0,
        password: 'password123',
      };

      const sanitizedEmail = '11234567890@optional.com';
      const result = service.sanitizeUsername(signUpDto, sanitizedEmail);

      expect(result).toBe('11234567890');
    });

    it('should generate username from WhatsApp number', () => {
      const signUpDto = {
        email: '',
        username: '',
        countryCode: 0,
        phoneNumber: 0,
        whatsappCountryCode: 1,
        whatsappPhoneNumber: 1234567890,
        password: 'password123',
      };

      const sanitizedEmail = '11234567890@whatsapp.com';
      const result = service.sanitizeUsername(signUpDto, sanitizedEmail);

      expect(result).toBe('11234567890@whatsapp');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should throw BadRequestException for invalid phone number', () => {
      (validatePhoneNumber as jest.Mock).mockReturnValue({ isValid: false });

      expect(() => service.validatePhoneNumber(1, 1234567890)).toThrow(
        BadRequestException,
      );
    });

    it('should not throw for valid phone number', () => {
      (validatePhoneNumber as jest.Mock).mockReturnValue({ isValid: true });

      expect(() => service.validatePhoneNumber(1, 1234567890)).not.toThrow();
    });
  });
});
