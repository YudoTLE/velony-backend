import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { EnvironmentVariables } from 'src/config/env.config';

import { RedisService } from './redis.service';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn(),
  }));
});

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: jest.Mocked<Redis>;
  let configService: jest.Mocked<ConfigService<EnvironmentVariables>>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get(ConfigService);

    // Get the mocked Redis instance
    mockRedisClient = (Redis as unknown as jest.Mock).mock.results[0].value;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create Redis client with correct configuration', () => {
      configService.get.mockImplementation((key: string) => {
        const config = {
          REDIS_HOST: 'localhost',
          REDIS_PORT: 6379,
          REDIS_PASSWORD: 'testpass',
        };
        return config[key as keyof typeof config];
      });

      // Create a new service instance to test constructor
      new RedisService(configService);

      expect(Redis).toHaveBeenCalledWith({
        host: 'localhost',
        port: 6379,
        password: 'testpass',
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });
    });

    it('should handle undefined config values', () => {
      configService.get.mockReturnValue(undefined);

      new RedisService(configService);

      expect(Redis).toHaveBeenCalledWith({
        host: undefined,
        port: undefined,
        password: undefined,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis client when module is destroyed', async () => {
      mockRedisClient.quit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalledTimes(1);
    });

    it('should handle quit failures gracefully', async () => {
      const error = new Error('Connection already closed');
      mockRedisClient.quit.mockRejectedValue(error);

      await expect(service.onModuleDestroy()).rejects.toThrow(
        'Connection already closed',
      );
    });
  });

  describe('get', () => {
    it('should retrieve value for existing key', async () => {
      const key = 'test:key';
      const value = 'test-value';
      mockRedisClient.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });

    it('should return null for non-existing key', async () => {
      const key = 'non:existing:key';
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });

    it('should handle Redis connection errors', async () => {
      const key = 'test:key';
      const error = new Error('Redis connection failed');
      mockRedisClient.get.mockRejectedValue(error);

      await expect(service.get(key)).rejects.toThrow('Redis connection failed');
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
    });

    it('should handle empty string keys', async () => {
      const key = '';
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });

    it('should handle special characters in keys', async () => {
      const key = 'test:key:with:special@chars#$%';
      const value = 'special-value';
      mockRedisClient.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });
  });

  describe('set', () => {
    it('should set key-value pair successfully', async () => {
      const key = 'test:key';
      const value = 'test-value';
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value);
    });

    it('should handle empty values', async () => {
      const key = 'test:key';
      const value = '';
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value);
    });

    it('should handle JSON string values', async () => {
      const key = 'user:123';
      const value = JSON.stringify({ id: 123, name: 'John Doe' });
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value);
    });

    it('should handle Redis set failures', async () => {
      const key = 'test:key';
      const value = 'test-value';
      const error = new Error('Redis set failed');
      mockRedisClient.set.mockRejectedValue(error);

      await expect(service.set(key, value)).rejects.toThrow('Redis set failed');
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value);
    });

    it('should handle large values', async () => {
      const key = 'large:data';
      const value = 'x'.repeat(10000); // 10KB string
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value);
    });
  });

  describe('setex', () => {
    it('should set key with expiration successfully', async () => {
      const key = 'session:abc123';
      const seconds = 3600;
      const value = 'session-data';
      mockRedisClient.setex.mockResolvedValue('OK');

      await service.setex(key, seconds, value);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(key, seconds, value);
    });

    it('should handle zero expiration time', async () => {
      const key = 'test:key';
      const seconds = 0;
      const value = 'test-value';
      mockRedisClient.setex.mockResolvedValue('OK');

      await service.setex(key, seconds, value);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(key, seconds, value);
    });

    it('should handle negative expiration time', async () => {
      const key = 'test:key';
      const seconds = -1;
      const value = 'test-value';
      mockRedisClient.setex.mockResolvedValue('OK');

      await service.setex(key, seconds, value);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(key, seconds, value);
    });

    it('should handle setex failures', async () => {
      const key = 'test:key';
      const seconds = 60;
      const value = 'test-value';
      const error = new Error('Redis setex failed');
      mockRedisClient.setex.mockRejectedValue(error);

      await expect(service.setex(key, seconds, value)).rejects.toThrow(
        'Redis setex failed',
      );
      expect(mockRedisClient.setex).toHaveBeenCalledWith(key, seconds, value);
    });

    it('should handle very large expiration times', async () => {
      const key = 'long:lived:key';
      const seconds = 2147483647; // Max 32-bit integer
      const value = 'persistent-value';
      mockRedisClient.setex.mockResolvedValue('OK');

      await service.setex(key, seconds, value);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(key, seconds, value);
    });
  });

  describe('del', () => {
    it('should delete existing key and return 1', async () => {
      const key = 'test:key';
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.del(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
      expect(result).toBe(1);
    });

    it('should return 0 for non-existing key', async () => {
      const key = 'non:existing:key';
      mockRedisClient.del.mockResolvedValue(0);

      const result = await service.del(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
      expect(result).toBe(0);
    });

    it('should handle deletion failures', async () => {
      const key = 'test:key';
      const error = new Error('Redis del failed');
      mockRedisClient.del.mockRejectedValue(error);

      await expect(service.del(key)).rejects.toThrow('Redis del failed');
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });

    it('should handle empty key deletion', async () => {
      const key = '';
      mockRedisClient.del.mockResolvedValue(0);

      const result = await service.del(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return 1 for existing key', async () => {
      const key = 'existing:key';
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.exists(key);

      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(1);
    });

    it('should return 0 for non-existing key', async () => {
      const key = 'non:existing:key';
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await service.exists(key);

      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(0);
    });

    it('should handle exists check failures', async () => {
      const key = 'test:key';
      const error = new Error('Redis exists failed');
      mockRedisClient.exists.mockRejectedValue(error);

      await expect(service.exists(key)).rejects.toThrow('Redis exists failed');
      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
    });

    it('should handle multiple exists scenarios', async () => {
      // Test multiple calls with different keys
      const keys = ['key1', 'key2', 'key3'];
      const results = [1, 0, 1];

      keys.forEach((key, index) => {
        // eslint-disable-next-line security/detect-object-injection
        mockRedisClient.exists.mockResolvedValueOnce(results[index]);
      });

      for (let i = 0; i < keys.length; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const result = await service.exists(keys[i]);
        // eslint-disable-next-line security/detect-object-injection
        expect(result).toBe(results[i]);
      }

      expect(mockRedisClient.exists).toHaveBeenCalledTimes(3);
    });
  });

  describe('expire', () => {
    it('should set expiration on existing key and return 1', async () => {
      const key = 'test:key';
      const seconds = 300;
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await service.expire(key, seconds);

      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, seconds);
      expect(result).toBe(1);
    });

    it('should return 0 for non-existing key', async () => {
      const key = 'non:existing:key';
      const seconds = 300;
      mockRedisClient.expire.mockResolvedValue(0);

      const result = await service.expire(key, seconds);

      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, seconds);
      expect(result).toBe(0);
    });

    it('should handle expire failures', async () => {
      const key = 'test:key';
      const seconds = 300;
      const error = new Error('Redis expire failed');
      mockRedisClient.expire.mockRejectedValue(error);

      await expect(service.expire(key, seconds)).rejects.toThrow(
        'Redis expire failed',
      );
      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, seconds);
    });

    it('should handle immediate expiration (0 seconds)', async () => {
      const key = 'test:key';
      const seconds = 0;
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await service.expire(key, seconds);

      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, seconds);
      expect(result).toBe(1);
    });

    it('should handle negative expiration time', async () => {
      const key = 'test:key';
      const seconds = -1;
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await service.expire(key, seconds);

      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, seconds);
      expect(result).toBe(1);
    });
  });

  describe('integration scenarios', () => {
    it('should handle a complete cache workflow', async () => {
      const key = 'user:session:123';
      const value = JSON.stringify({ userId: 123, roles: ['user'] });

      // Test exists (should not exist initially)
      mockRedisClient.exists.mockResolvedValueOnce(0);
      expect(await service.exists(key)).toBe(0);

      // Test set with expiration
      mockRedisClient.setex.mockResolvedValueOnce('OK');
      await service.setex(key, 3600, value);

      // Test exists (should exist now)
      mockRedisClient.exists.mockResolvedValueOnce(1);
      expect(await service.exists(key)).toBe(1);

      // Test get
      mockRedisClient.get.mockResolvedValueOnce(value);
      const retrievedValue = await service.get(key);
      expect(retrievedValue).toBe(value);

      // Test expire (extend expiration)
      mockRedisClient.expire.mockResolvedValueOnce(1);
      expect(await service.expire(key, 7200)).toBe(1);

      // Test delete
      mockRedisClient.del.mockResolvedValueOnce(1);
      expect(await service.del(key)).toBe(1);

      // Verify all operations were called correctly
      expect(mockRedisClient.exists).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.setex).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.get).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.expire).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.del).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent operations gracefully', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', 'value3'];

      // Mock all operations to succeed
      keys.forEach(() => {
        mockRedisClient.set.mockResolvedValueOnce('OK');
        mockRedisClient.get.mockResolvedValueOnce('test-value');
      });

      // Execute operations concurrently
      const setPromises = keys.map((key, index) =>
        // eslint-disable-next-line security/detect-object-injection
        service.set(key, values[index]),
      );
      const getPromises = keys.map((key) => service.get(key));

      await Promise.all([...setPromises, ...getPromises]);

      expect(mockRedisClient.set).toHaveBeenCalledTimes(3);
      expect(mockRedisClient.get).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const operations = [
        { key: 'success:key', shouldFail: false },
        { key: 'fail:key', shouldFail: true },
        { key: 'another:success', shouldFail: false },
      ];

      const results: Array<{
        key: string;
        error?: string;
        value?: string | null;
      }> = [];
      for (const operation of operations) {
        if (operation.shouldFail) {
          mockRedisClient.get.mockRejectedValueOnce(
            new Error('Operation failed'),
          );
          try {
            await service.get(operation.key);
          } catch (error) {
            results.push({ key: operation.key, error: error.message });
          }
        } else {
          mockRedisClient.get.mockResolvedValueOnce('success-value');
          const value = await service.get(operation.key);
          results.push({ key: operation.key, value });
        }
      }

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        key: 'success:key',
        value: 'success-value',
      });
      expect(results[1]).toEqual({
        key: 'fail:key',
        error: 'Operation failed',
      });
      expect(results[2]).toEqual({
        key: 'another:success',
        value: 'success-value',
      });
    });
  });

  describe('edge cases and robustness', () => {
    it('should handle very long keys', async () => {
      const longKey = 'a'.repeat(1000);
      const value = 'test-value';
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set(longKey, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(longKey, value);
    });

    it('should handle Unicode characters in keys and values', async () => {
      const unicodeKey = 'user:🔑:test';
      const unicodeValue = 'Hello 世界! 🌍';
      mockRedisClient.setex.mockResolvedValue('OK');

      await service.setex(unicodeKey, 300, unicodeValue);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        unicodeKey,
        300,
        unicodeValue,
      );
    });

    it('should handle null and undefined scenarios gracefully', async () => {
      // Test with null return from Redis
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('test:key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
    });

    it('should handle Redis timeout scenarios', async () => {
      const timeoutError = new Error('Command timed out');
      timeoutError.name = 'TimeoutError';
      mockRedisClient.get.mockRejectedValue(timeoutError);

      await expect(service.get('timeout:key')).rejects.toThrow(
        'Command timed out',
      );
    });

    it('should handle Redis connection loss scenarios', async () => {
      const connectionError = new Error('Connection lost');
      connectionError.name = 'ConnectionError';
      mockRedisClient.set.mockRejectedValue(connectionError);

      await expect(service.set('test:key', 'value')).rejects.toThrow(
        'Connection lost',
      );
    });
  });
});
