import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { QueryResult } from 'pg';

import { CreateUserWithUsernameRequestDto } from './dto/create-user-with-username-request.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UserSummaryResponseDto } from './dto/user-summary-response.dto';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let mockDatabaseService: {
    query: jest.Mock;
  };

  const mockUserRow = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phone_number: '+1234567890',
    profile_picture_url: 'https://example.com/profile.jpg',
    created_at: new Date('2025-01-01T00:00:00Z'),
    updated_at: new Date('2025-01-01T00:00:00Z'),
  };

  const mockQueryResult: QueryResult = {
    rows: [mockUserRow],
    command: 'SELECT',
    rowCount: 1,
    oid: 0,
    fields: [],
  } as QueryResult;

  beforeEach(async () => {
    mockDatabaseService = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUserWithUsername', () => {
    const createUserDto: CreateUserWithUsernameRequestDto = {
      name: 'John Doe',
      username: 'johndoe',
      password: 'StrongPassword123!',
    };

    beforeEach(() => {
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
    });

    it('should create a user successfully', async () => {
      mockDatabaseService.query.mockResolvedValue(mockQueryResult);

      const result = await service.createUserWithUsername(createUserDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        12,
      );
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [createUserDto.name, createUserDto.username, 'hashedPassword'],
      );
      expect(result).toBeInstanceOf(UserDetailResponseDto);
      expect(result.uuid).toBe(mockUserRow.uuid);
      expect(result.name).toBe(mockUserRow.name);
      expect(result.username).toBe(mockUserRow.username);
    });

    it('should throw ConflictException when username already exists', async () => {
      const dbError = {
        code: '23505',
        constraint: 'users_username_unique',
      };
      mockDatabaseService.query.mockRejectedValue(dbError);

      await expect(
        service.createUserWithUsername(createUserDto),
      ).rejects.toThrow(ConflictException);

      expect(mockDatabaseService.query).toHaveBeenCalledTimes(1);
    });

    it('should rethrow other database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockDatabaseService.query.mockRejectedValue(dbError);

      await expect(
        service.createUserWithUsername(createUserDto),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('findAll', () => {
    it('should return an array of user summaries', async () => {
      const mockSummaryRows = [
        {
          uuid: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          username: 'johndoe',
          profile_picture_url: 'https://example.com/profile.jpg',
        },
        {
          uuid: '456e7890-e89b-12d3-a456-426614174001',
          name: 'Jane Smith',
          username: 'janesmith',
          profile_picture_url: null,
        },
      ];

      const mockSummaryResult: QueryResult = {
        rows: mockSummaryRows,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockDatabaseService.query.mockResolvedValue(mockSummaryResult);

      const result = await service.findAll();

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT uuid, name, username, profile_picture_url FROM users ORDER BY created_at DESC',
        ),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserSummaryResponseDto);
      expect(result[0].uuid).toBe(mockSummaryRows[0].uuid);
      expect(result[1].uuid).toBe(mockSummaryRows[1].uuid);
    });

    it('should return an empty array when no users exist', async () => {
      const emptyResult: QueryResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockDatabaseService.query.mockResolvedValue(emptyResult);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockDatabaseService.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByUuid', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should return a user when found', async () => {
      mockDatabaseService.query.mockResolvedValue(mockQueryResult);

      const result = await service.findByUuid(validUuid);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT uuid, name, username, email, phone_number, profile_picture_url, created_at, updated_at FROM users WHERE uuid = $1',
        ),
        [validUuid],
      );
      expect(result).toBeInstanceOf(UserDetailResponseDto);
      expect(result.uuid).toBe(mockUserRow.uuid);
    });

    it('should throw NotFoundException when user not found', async () => {
      const emptyResult: QueryResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockDatabaseService.query.mockResolvedValue(emptyResult);

      await expect(service.findByUuid(validUuid)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockDatabaseService.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByEmail', () => {
    const email = 'john@example.com';

    it('should return a user when found', async () => {
      mockDatabaseService.query.mockResolvedValue(mockQueryResult);

      const result = await service.findByEmail(email);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        [email],
      );
      expect(result).toBeInstanceOf(UserDetailResponseDto);
      expect(result?.uuid).toBe(mockUserRow.uuid);
    });

    it('should return null when user not found', async () => {
      const emptyResult: QueryResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockDatabaseService.query.mockResolvedValue(emptyResult);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
      expect(mockDatabaseService.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByUsername', () => {
    const username = 'johndoe';

    it('should return a user when found', async () => {
      mockDatabaseService.query.mockResolvedValue(mockQueryResult);

      const result = await service.findByUsername(username);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = $1',
        [username],
      );
      expect(result).toBeInstanceOf(UserDetailResponseDto);
      expect(result?.uuid).toBe(mockUserRow.uuid);
    });

    it('should return null when user not found', async () => {
      const emptyResult: QueryResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockDatabaseService.query.mockResolvedValue(emptyResult);

      const result = await service.findByUsername(username);

      expect(result).toBeNull();
    });
  });

  describe('findByPhone', () => {
    const phoneNumber = '+1234567890';

    it('should return a user when found', async () => {
      mockDatabaseService.query.mockResolvedValue(mockQueryResult);

      const result = await service.findByPhone(phoneNumber);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE phone_number = $1',
        [phoneNumber],
      );
      expect(result).toBeInstanceOf(UserDetailResponseDto);
      expect(result?.uuid).toBe(mockUserRow.uuid);
    });

    it('should return null when user not found', async () => {
      const emptyResult: QueryResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockDatabaseService.query.mockResolvedValue(emptyResult);

      const result = await service.findByPhone(phoneNumber);

      expect(result).toBeNull();
    });
  });

  describe('validatePassword', () => {
    const password = 'testPassword';
    const hashedPassword = 'hashedPassword';

    it('should return true for valid password', async () => {
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validatePassword(hashedPassword, password);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword,
      );
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validatePassword(hashedPassword, password);

      expect(result).toBe(false);
    });

    it('should return false when passwordHash is null', async () => {
      const result = await service.validatePassword(null, password);

      expect(result).toBe(false);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });
  });
});
