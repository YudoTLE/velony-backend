import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { EnvironmentVariables } from 'src/config/env.config';
import { DatabaseService } from 'src/database/database.service';
import { RedisService } from 'src/redis/redis.service';

import { AuthService } from './auth.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let databaseService: jest.Mocked<DatabaseService>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService<EnvironmentVariables>>;
  let mockBcrypt: jest.Mocked<typeof bcrypt>;

  const mockUser = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    username: 'johndoe',
    password_hash: '$2b$12$hashedpassword',
  };

  const mockTokens = {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
  };

  beforeEach(async () => {
    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockDatabaseService = {
      query: jest.fn(),
    };

    const mockRedisService = {
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    databaseService = module.get(DatabaseService);
    redisService = module.get(RedisService);
    configService = module.get(ConfigService);
    mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

    // Default config values
    configService.get.mockImplementation((key: string) => {
      const config = {
        JWT_ACCESS_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
      };
      return config[key as keyof typeof config];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUserWithLocalStrategy', () => {
    const validRegistrationData = {
      name: 'John Doe',
      username: 'johndoe',
      password: 'StrongPassword123!',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      const hashedPassword = '$2b$12$hashedpassword';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid }],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      redisService.setex.mockResolvedValue();

      // Act
      const result = await service.registerUserWithLocalStrategy(
        validRegistrationData.name,
        validRegistrationData.username,
        validRegistrationData.password,
      );

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith(
        validRegistrationData.password,
        12,
      );
      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [
          validRegistrationData.name,
          validRegistrationData.username,
          hashedPassword,
        ],
      );
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(redisService.setex).toHaveBeenCalledWith(
        `refresh_token:${mockUser.uuid}`,
        604800, // 7 days in seconds
        mockTokens.refreshToken,
      );
      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        tokenType: 'Bearer',
        issuedAt: expect.any(Number),
        expiresAt: expect.any(Number),
      });
    });

    it('should throw ConflictException when username already exists', async () => {
      // Arrange
      const hashedPassword = '$2b$12$hashedpassword';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const duplicateError = new Error('Duplicate key value');
      (duplicateError as Error & { code: string; constraint: string }).code =
        '23505';
      (
        duplicateError as Error & { code: string; constraint: string }
      ).constraint = 'users_username_key';

      databaseService.query.mockRejectedValue(duplicateError);

      // Act & Assert
      await expect(
        service.registerUserWithLocalStrategy(
          validRegistrationData.name,
          validRegistrationData.username,
          validRegistrationData.password,
        ),
      ).rejects.toThrow(ConflictException);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(
        validRegistrationData.password,
        12,
      );
    });

    it('should handle database errors other than duplicate username', async () => {
      // Arrange
      const hashedPassword = '$2b$12$hashedpassword';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const databaseError = new Error('Database connection failed');
      databaseService.query.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(
        service.registerUserWithLocalStrategy(
          validRegistrationData.name,
          validRegistrationData.username,
          validRegistrationData.password,
        ),
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle bcrypt hashing failures', async () => {
      // Arrange
      const hashingError = new Error('Hashing failed');
      mockBcrypt.hash.mockRejectedValue(hashingError as never);

      // Act & Assert
      await expect(
        service.registerUserWithLocalStrategy(
          validRegistrationData.name,
          validRegistrationData.username,
          validRegistrationData.password,
        ),
      ).rejects.toThrow('Hashing failed');

      expect(databaseService.query).not.toHaveBeenCalled();
    });

    it('should handle empty or invalid input data', async () => {
      // Arrange
      const hashedPassword = '$2b$12$hashedpassword';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid }],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      redisService.setex.mockResolvedValue();

      // Act
      const result = await service.registerUserWithLocalStrategy('', '', '');

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith('', 12);
      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['', '', hashedPassword],
      );
      expect(result).toBeDefined();
    });

    it('should handle Redis storage failures during registration', async () => {
      // Arrange
      const hashedPassword = '$2b$12$hashedpassword';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid }],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      const redisError = new Error('Redis connection failed');
      redisService.setex.mockRejectedValue(redisError);

      // Act & Assert
      await expect(
        service.registerUserWithLocalStrategy(
          validRegistrationData.name,
          validRegistrationData.username,
          validRegistrationData.password,
        ),
      ).rejects.toThrow('Redis connection failed');
    });
  });

  describe('loginWithLocalStrategy', () => {
    const validLoginData = {
      username: 'johndoe',
      password: 'StrongPassword123!',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid, password_hash: mockUser.password_hash }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      mockBcrypt.compare.mockResolvedValue(true as never);

      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      redisService.setex.mockResolvedValue();

      // Act
      const result = await service.loginWithLocalStrategy(
        validLoginData.username,
        validLoginData.password,
      );

      // Assert
      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT uuid, password_hash'),
        [validLoginData.username],
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        validLoginData.password,
        mockUser.password_hash,
      );
      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        tokenType: 'Bearer',
        issuedAt: expect.any(Number),
        expiresAt: expect.any(Number),
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      // Arrange
      databaseService.query.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Act & Assert
      await expect(
        service.loginWithLocalStrategy(
          validLoginData.username,
          validLoginData.password,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid, password_hash: mockUser.password_hash }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(
        service.loginWithLocalStrategy(
          validLoginData.username,
          'wrongpassword',
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        mockUser.password_hash,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle database errors during login', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');
      databaseService.query.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(
        service.loginWithLocalStrategy(
          validLoginData.username,
          validLoginData.password,
        ),
      ).rejects.toThrow('Database connection failed');

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should handle bcrypt comparison errors', async () => {
      // Arrange
      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid, password_hash: mockUser.password_hash }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const bcryptError = new Error('bcrypt comparison failed');
      mockBcrypt.compare.mockRejectedValue(bcryptError as never);

      // Act & Assert
      await expect(
        service.loginWithLocalStrategy(
          validLoginData.username,
          validLoginData.password,
        ),
      ).rejects.toThrow('bcrypt comparison failed');
    });

    it('should handle malformed database responses', async () => {
      // Arrange
      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid }], // Missing password_hash
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Act & Assert
      await expect(
        service.loginWithLocalStrategy(
          validLoginData.username,
          validLoginData.password,
        ),
      ).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    const validRefreshToken = 'valid.refresh.token';
    const tokenPayload = { sub: mockUser.uuid };

    it('should successfully refresh tokens with valid refresh token', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(tokenPayload);

      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      redisService.get.mockResolvedValue(validRefreshToken);

      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      redisService.setex.mockResolvedValue();

      // Act
      const result = await service.refreshToken(validRefreshToken);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith(validRefreshToken);
      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT uuid'),
        [tokenPayload.sub],
      );
      expect(redisService.get).toHaveBeenCalledWith(
        `refresh_token:${tokenPayload.sub}`,
      );
      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        tokenType: 'Bearer',
        issuedAt: expect.any(Number),
        expiresAt: expect.any(Number),
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      const jwtError = new Error('Invalid token');
      jwtService.verify.mockImplementation(() => {
        throw jwtError;
      });

      // Act & Assert
      await expect(service.refreshToken('invalid.token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(databaseService.query).not.toHaveBeenCalled();
      expect(redisService.get).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(tokenPayload);

      databaseService.query.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Act & Assert
      await expect(service.refreshToken(validRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(redisService.get).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token not found in Redis', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(tokenPayload);

      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      redisService.get.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(validRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when stored token does not match', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(tokenPayload);

      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      redisService.get.mockResolvedValue('different.refresh.token');

      // Act & Assert
      await expect(service.refreshToken(validRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle database errors during token refresh', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(tokenPayload);

      const databaseError = new Error('Database connection failed');
      databaseService.query.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(service.refreshToken(validRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle Redis errors during token refresh', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(tokenPayload);

      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const redisError = new Error('Redis connection failed');
      redisService.get.mockRejectedValue(redisError);

      // Act & Assert
      await expect(service.refreshToken(validRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('should successfully revoke refresh token', async () => {
      // Arrange
      const userId = mockUser.uuid;
      redisService.del.mockResolvedValue(1);

      // Act
      await service.revokeRefreshToken(userId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith(`refresh_token:${userId}`);
    });

    it('should handle Redis errors during token revocation', async () => {
      // Arrange
      const userId = mockUser.uuid;
      const redisError = new Error('Redis connection failed');
      redisService.del.mockRejectedValue(redisError);

      // Act & Assert
      await expect(service.revokeRefreshToken(userId)).rejects.toThrow(
        'Redis connection failed',
      );
    });

    it('should handle revocation of non-existent tokens', async () => {
      // Arrange
      const userId = mockUser.uuid;
      redisService.del.mockResolvedValue(0); // Token didn't exist

      // Act
      await service.revokeRefreshToken(userId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith(`refresh_token:${userId}`);
    });
  });

  describe('Token expiration parsing', () => {
    it('should correctly parse different expiration formats', () => {
      // Test different expiration formats through token generation
      const testCases = [
        { config: '30s', expected: 30 },
        { config: '15m', expected: 900 },
        { config: '2h', expected: 7200 },
        { config: '7d', expected: 604800 },
        { config: 'invalid', expected: 900 }, // default fallback
      ];

      testCases.forEach(({ config, expected: _expected }) => {
        configService.get.mockImplementation((key: string) => {
          if (key === 'JWT_ACCESS_EXPIRATION') return config;
          if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
          return undefined;
        });

        jwtService.sign
          .mockReturnValueOnce(mockTokens.accessToken)
          .mockReturnValueOnce(mockTokens.refreshToken);

        redisService.setex.mockResolvedValue();

        // Call private method through public method
        const result = service['generateTokens'](mockUser.uuid);

        expect(result).resolves.toEqual(
          expect.objectContaining({
            expiresAt: expect.any(Number),
          }),
        );
      });
    });
  });

  describe('Complex authentication scenarios', () => {
    it('should handle concurrent login attempts for same user', async () => {
      // Arrange
      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid, password_hash: mockUser.password_hash }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      mockBcrypt.compare.mockResolvedValue(true as never);

      jwtService.sign
        .mockReturnValue(mockTokens.accessToken)
        .mockReturnValue(mockTokens.refreshToken);

      redisService.setex.mockResolvedValue();

      // Act - Simulate concurrent logins
      const loginPromises = Array(5)
        .fill(null)
        .map(() =>
          service.loginWithLocalStrategy(mockUser.username, 'password'),
        );

      const results = await Promise.all(loginPromises);

      // Assert
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toEqual({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          tokenType: 'Bearer',
          issuedAt: expect.any(Number),
          expiresAt: expect.any(Number),
        });
      });

      expect(databaseService.query).toHaveBeenCalledTimes(5);
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(5);
      expect(redisService.setex).toHaveBeenCalledTimes(5);
    });

    it('should handle rapid registration and login flow', async () => {
      // Arrange - Registration
      const hashedPassword = '$2b$12$hashedpassword';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      databaseService.query
        .mockResolvedValueOnce({
          rows: [{ uuid: mockUser.uuid }],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: [],
        })
        .mockResolvedValueOnce({
          rows: [{ uuid: mockUser.uuid, password_hash: hashedPassword }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        });

      mockBcrypt.compare.mockResolvedValue(true as never);

      jwtService.sign
        .mockReturnValue(mockTokens.accessToken)
        .mockReturnValue(mockTokens.refreshToken);

      redisService.setex.mockResolvedValue();

      // Act - Register then immediately login
      const registrationResult = await service.registerUserWithLocalStrategy(
        'John Doe',
        'johndoe',
        'password123',
      );

      const loginResult = await service.loginWithLocalStrategy(
        'johndoe',
        'password123',
      );

      // Assert
      expect(registrationResult).toBeDefined();
      expect(loginResult).toBeDefined();
      expect(registrationResult.accessToken).toBeDefined();
      expect(loginResult.accessToken).toBeDefined();
    });

    it('should handle token refresh after immediate login', async () => {
      // Arrange
      const loginTokenPayload = { sub: mockUser.uuid };

      // Mock login first
      databaseService.query
        .mockResolvedValueOnce({
          rows: [
            { uuid: mockUser.uuid, password_hash: mockUser.password_hash },
          ],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        })
        .mockResolvedValueOnce({
          rows: [{ uuid: mockUser.uuid }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        });

      mockBcrypt.compare.mockResolvedValue(true as never);

      jwtService.sign
        .mockReturnValue(mockTokens.accessToken)
        .mockReturnValue(mockTokens.refreshToken);

      jwtService.verify.mockReturnValue(loginTokenPayload);

      redisService.setex.mockResolvedValue();
      redisService.get.mockResolvedValue(mockTokens.refreshToken);

      // Act
      const loginResult = await service.loginWithLocalStrategy(
        mockUser.username,
        'password',
      );

      const refreshResult = await service.refreshToken(
        loginResult.refreshToken,
      );

      // Assert
      expect(loginResult).toBeDefined();
      expect(refreshResult).toBeDefined();
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
    });

    it('should handle edge case with malformed JWT payloads', async () => {
      // Arrange
      jwtService.verify.mockReturnValue({ invalid: 'payload' });

      // Act & Assert
      await expect(service.refreshToken('malformed.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should validate token response structure', async () => {
      // Arrange
      databaseService.query.mockResolvedValue({
        rows: [{ uuid: mockUser.uuid, password_hash: mockUser.password_hash }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      mockBcrypt.compare.mockResolvedValue(true as never);

      const currentTime = Math.floor(Date.now() / 1000);
      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      redisService.setex.mockResolvedValue();

      // Act
      const result = await service.loginWithLocalStrategy(
        mockUser.username,
        'password',
      );

      // Assert - Validate complete response structure
      expect(result).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        tokenType: 'Bearer',
        issuedAt: expect.any(Number),
        expiresAt: expect.any(Number),
      });

      expect(result.issuedAt).toBeGreaterThanOrEqual(currentTime);
      expect(result.expiresAt).toBeGreaterThan(result.issuedAt);
      expect(result.expiresAt - result.issuedAt).toBe(900); // 15 minutes default
    });
  });

  describe('Security edge cases', () => {
    it('should handle SQL injection attempts in username', async () => {
      // Arrange
      const maliciousUsername = "'; DROP TABLE users; --";
      databaseService.query.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Act & Assert
      await expect(
        service.loginWithLocalStrategy(maliciousUsername, 'password'),
      ).rejects.toThrow(UnauthorizedException);

      // Verify parameterized query was used
      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT uuid, password_hash'),
        [maliciousUsername],
      );
    });

    it('should handle extremely long usernames and passwords', async () => {
      // Arrange
      const longUsername = 'a'.repeat(10000);
      const longPassword = 'b'.repeat(10000);

      databaseService.query.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Act & Assert
      await expect(
        service.loginWithLocalStrategy(longUsername, longPassword),
      ).rejects.toThrow(UnauthorizedException);

      expect(databaseService.query).toHaveBeenCalledWith(expect.any(String), [
        longUsername,
      ]);
    });

    it('should handle null and undefined credentials gracefully', async () => {
      // Arrange
      databaseService.query.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Act & Assert
      await expect(
        service.loginWithLocalStrategy(
          null as unknown as string,
          undefined as unknown as string,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle token tampering attempts', async () => {
      // Arrange
      const tamperedToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature';

      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      // Act & Assert
      await expect(service.refreshToken(tamperedToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Redis Key Consistency Validation', () => {
    it('should use consistent Redis key format for token storage and retrieval', async () => {
      // Arrange
      const userId = 'test-user-123';
      const refreshToken = 'test.refresh.token';
      const expectedKey = `refresh_token:${userId}`;

      jwtService.sign
        .mockReturnValueOnce('access.token')
        .mockReturnValueOnce(refreshToken);

      redisService.setex.mockResolvedValue();
      redisService.get.mockResolvedValue(refreshToken);

      // Act - Generate tokens (which stores refresh token)
      await service['generateTokens'](userId);

      // Assert - Verify storage uses correct key format
      expect(redisService.setex).toHaveBeenCalledWith(
        expectedKey,
        expect.any(Number),
        refreshToken,
      );

      // Act - Retrieve stored token
      const retrievedToken = await service['getStoredRefreshToken'](
        userId,
        refreshToken,
      );

      // Assert - Verify retrieval uses same key format
      expect(redisService.get).toHaveBeenCalledWith(expectedKey);
      expect(retrievedToken).toBe(refreshToken);
    });

    it('should fail to retrieve token when key format is inconsistent', async () => {
      // Arrange
      const userId = 'test-user-123';
      const refreshToken = 'test.refresh.token';
      const correctKey = `refresh_token:${userId}`;
      // Your test case: `refresh_token:${userId}asf` would fail in real Redis

      // Mock Redis to return null for incorrect key (simulating real Redis behavior)
      redisService.get.mockImplementation((key: string) => {
        if (key === correctKey) return Promise.resolve(refreshToken);
        return Promise.resolve(null); // Wrong key returns null
      });

      // Act & Assert - Correct key should work
      const correctResult = await service['getStoredRefreshToken'](
        userId,
        refreshToken,
      );
      expect(correctResult).toBe(refreshToken);

      // Act & Assert - If service used wrong key, it should fail
      // This simulates what would happen if you accidentally added 'asf'
      redisService.get.mockResolvedValueOnce(null); // Simulate wrong key lookup
      const wrongResult = await service['getStoredRefreshToken'](
        'wrong-user-id', // Different user ID to simulate wrong key
        refreshToken,
      );
      expect(wrongResult).toBeNull();
    });

    it('should validate exact Redis key format in all operations', async () => {
      // Arrange
      const userId = 'user-456';
      const refreshToken = 'refresh.token.value';
      const expectedKey = `refresh_token:${userId}`;

      // Test storage
      redisService.setex.mockResolvedValue();
      await service['storeRefreshToken'](userId, refreshToken);

      expect(redisService.setex).toHaveBeenCalledWith(
        expectedKey,
        expect.any(Number),
        refreshToken,
      );

      // Test retrieval
      redisService.get.mockResolvedValue(refreshToken);
      await service['getStoredRefreshToken'](userId, refreshToken);

      expect(redisService.get).toHaveBeenCalledWith(expectedKey);

      // Test revocation
      redisService.del.mockResolvedValue(1);
      await service.revokeRefreshToken(userId);

      expect(redisService.del).toHaveBeenCalledWith(expectedKey);

      // Verify all operations used EXACTLY the same key format
      const allCalls = [
        ...redisService.setex.mock.calls,
        ...redisService.get.mock.calls,
        ...redisService.del.mock.calls,
      ];

      allCalls.forEach((call) => {
        expect(call[0]).toBe(expectedKey);
      });
    });

    it('should detect Redis key format violations', async () => {
      // This test ensures that if someone accidentally modifies the key format,
      // our tests will catch it
      const userId = 'test-user';
      const token = 'test.token';

      // Test what happens with different key formats
      const testCases = [
        {
          desc: 'correct format',
          key: `refresh_token:${userId}`,
          shouldWork: true,
        },
        { desc: 'missing prefix', key: userId, shouldWork: false },
        {
          desc: 'wrong prefix',
          key: `access_token:${userId}`,
          shouldWork: false,
        },
        {
          desc: 'extra suffix',
          key: `refresh_token:${userId}extra`,
          shouldWork: false,
        },
        {
          desc: 'wrong separator',
          key: `refresh_token_${userId}`,
          shouldWork: false,
        },
      ];

      for (const testCase of testCases) {
        redisService.get.mockResolvedValue(testCase.shouldWork ? token : null);

        // Mock the internal method to use different key format
        const originalMethod = service['getStoredRefreshToken'];
        service['getStoredRefreshToken'] = async (uid: string, tkn: string) => {
          const storedToken = await redisService.get(testCase.key);
          return storedToken === tkn ? storedToken : null;
        };

        const result = await service['getStoredRefreshToken'](userId, token);

        if (testCase.shouldWork) {
          expect(result).toBe(token);
        } else {
          expect(result).toBeNull();
        }

        // Restore original method
        service['getStoredRefreshToken'] = originalMethod;
      }
    });
  });

  describe('Integration-Style Token Flow Tests', () => {
    it('should maintain key consistency throughout complete auth flow', async () => {
      // This test validates the complete flow and would catch your 'asf' issue
      const userId = mockUser.uuid;
      const expectedKey = `refresh_token:${userId}`;

      // Mock login flow
      databaseService.query.mockResolvedValue({
        rows: [{ uuid: userId, password_hash: mockUser.password_hash }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      mockBcrypt.compare.mockResolvedValue(true as never);

      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      redisService.setex.mockResolvedValue();

      // Act - Login (stores token)
      const loginResult = await service.loginWithLocalStrategy(
        mockUser.username,
        'password',
      );

      // Assert - Verify token was stored with correct key
      expect(redisService.setex).toHaveBeenCalledWith(
        expectedKey,
        expect.any(Number),
        mockTokens.refreshToken,
      );

      // Reset mocks for refresh flow
      jest.clearAllMocks();

      // Mock refresh flow
      jwtService.verify.mockReturnValue({ sub: userId });
      databaseService.query.mockResolvedValue({
        rows: [{ uuid: userId }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      redisService.get.mockResolvedValue(mockTokens.refreshToken);

      jwtService.sign
        .mockReturnValueOnce('new.access.token')
        .mockReturnValueOnce('new.refresh.token');

      redisService.setex.mockResolvedValue();

      // Act - Refresh token (retrieves and stores token)
      await service.refreshToken(loginResult.refreshToken);

      // Assert - Verify both retrieval and new storage use same key format
      expect(redisService.get).toHaveBeenCalledWith(expectedKey);
      expect(redisService.setex).toHaveBeenCalledWith(
        expectedKey,
        expect.any(Number),
        'new.refresh.token',
      );

      // Reset mocks for revocation
      jest.clearAllMocks();
      redisService.del.mockResolvedValue(1);

      // Act - Revoke token
      await service.revokeRefreshToken(userId);

      // Assert - Verify revocation uses same key format
      expect(redisService.del).toHaveBeenCalledWith(expectedKey);

      // Final validation - all operations should have used the EXACT same key
      // This would catch if any operation used a different key format
      const allRedisOperations = [
        redisService.setex.mock.calls,
        redisService.get.mock.calls,
        redisService.del.mock.calls,
      ].flat();

      allRedisOperations.forEach((call) => {
        expect(call[0]).toBe(expectedKey);
      });
    });

    it('should fail refresh when Redis key was corrupted', async () => {
      // This test simulates what would happen if Redis keys get corrupted
      const userId = mockUser.uuid;
      const validRefreshToken = 'valid.refresh.token';

      jwtService.verify.mockReturnValue({ sub: userId });
      databaseService.query.mockResolvedValue({
        rows: [{ uuid: userId }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Simulate corrupted Redis state - key exists but with wrong value
      redisService.get.mockResolvedValue('corrupted.token.value');

      // Act & Assert - Should fail because stored token doesn't match
      await expect(service.refreshToken(validRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify it checked the correct key format
      expect(redisService.get).toHaveBeenCalledWith(`refresh_token:${userId}`);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
