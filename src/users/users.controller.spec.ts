import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateUserWithUsernameRequestDto } from './dto/create-user-with-username-request.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UserSummaryResponseDto } from './dto/user-summary-response.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: {
    createUserWithUsername: jest.Mock;
    findAll: jest.Mock;
    findByUuid: jest.Mock;
  };

  const mockUserDetailResponse: UserDetailResponseDto = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    profilePictureUrl: 'https://example.com/profile.jpg',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };

  const mockUserSummaryResponse: UserSummaryResponseDto = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    username: 'johndoe',
    profilePictureUrl: 'https://example.com/profile.jpg',
  };

  beforeEach(async () => {
    mockUsersService = {
      createUserWithUsername: jest.fn(),
      findAll: jest.fn(),
      findByUuid: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUserWithUsername', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserWithUsernameRequestDto = {
        name: 'John Doe',
        username: 'johndoe',
        password: 'StrongPassword123!',
      };

      mockUsersService.createUserWithUsername.mockResolvedValue(
        mockUserDetailResponse,
      );

      const result = await controller.createUserWithUsername(createUserDto);

      expect(mockUsersService.createUserWithUsername).toHaveBeenCalledWith(
        createUserDto,
      );
      expect(mockUsersService.createUserWithUsername).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUserDetailResponse);
    });

    it('should throw ConflictException when username already exists', async () => {
      const createUserDto: CreateUserWithUsernameRequestDto = {
        name: 'John Doe',
        username: 'existinguser',
        password: 'StrongPassword123!',
      };

      mockUsersService.createUserWithUsername.mockRejectedValue(
        new ConflictException('Username already exists'),
      );

      await expect(
        controller.createUserWithUsername(createUserDto),
      ).rejects.toThrow(ConflictException);
      expect(mockUsersService.createUserWithUsername).toHaveBeenCalledWith(
        createUserDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of user summaries', async () => {
      const mockUsers: UserSummaryResponseDto[] = [
        mockUserSummaryResponse,
        {
          uuid: '456e7890-e89b-12d3-a456-426614174001',
          name: 'Jane Smith',
          username: 'janesmith',
          profilePictureUrl: 'https://example.com/jane.jpg',
        },
      ];

      mockUsersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should return a user detail when found', async () => {
      mockUsersService.findByUuid.mockResolvedValue(mockUserDetailResponse);

      const result = await controller.findOne(validUuid);

      expect(mockUsersService.findByUuid).toHaveBeenCalledWith(validUuid);
      expect(mockUsersService.findByUuid).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUserDetailResponse);
    });

    it('should throw NotFoundException when user not found', async () => {
      const nonExistentUuid = '999e9999-e89b-12d3-a456-426614174999';

      mockUsersService.findByUuid.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.findOne(nonExistentUuid)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.findByUuid).toHaveBeenCalledWith(nonExistentUuid);
    });
  });
});
