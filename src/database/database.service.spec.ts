import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool, PoolClient as _PoolClient } from 'pg';

import { DatabaseService } from './database.service';

// Mock the pg module
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  })),
}));

describe('DatabaseService', () => {
  let service: DatabaseService;
  let _mockConfigService: ConfigService;
  let mockPool: {
    connect: jest.Mock;
    query: jest.Mock;
    end: jest.Mock;
    on: jest.Mock;
  };
  let mockClient: {
    query: jest.Mock;
    release: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    };

    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(
      () => mockPool as unknown as Pool,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest
              .fn()
              .mockReturnValue('postgresql://test:test@localhost:5432/test'),
            get: jest.fn((key: string) => {
              switch (key) {
                case 'NODE_ENV':
                  return 'development';
                case 'DB_MAX_CONNECTIONS':
                  return 20;
                case 'DB_IDLE_TIMEOUT':
                  return 30000;
                case 'DB_CONNECTION_TIMEOUT':
                  return 2000;
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    _mockConfigService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create pool with correct config and test connection', async () => {
      await service.onModuleInit();

      expect(Pool).toHaveBeenCalledWith({
        connectionString: 'postgresql://test:test@localhost:5432/test',
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should throw error if connection test fails', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    });
  });

  describe('onModuleDestroy', () => {
    it('should end the pool', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockPool.end).toHaveBeenCalledTimes(1);
    });
  });

  describe('query method', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      jest.clearAllMocks(); // Clear init calls
    });

    it('should execute query and return result', async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
      mockClient.query.mockResolvedValue(mockResult);

      const result = await service.query('SELECT * FROM test WHERE id = $1', [
        1,
      ]);

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM test WHERE id = $1',
        [1],
      );
      expect(mockClient.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should release client even if query fails', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      await expect(service.query('INVALID SQL', [])).rejects.toThrow(
        'Query failed',
      );

      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should handle queries without parameters', async () => {
      const mockResult = { rows: [{ count: 5 }], rowCount: 1 };
      mockClient.query.mockResolvedValue(mockResult);

      const result = await service.query('SELECT COUNT(*) FROM users');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) FROM users',
        undefined,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getClient method', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      jest.clearAllMocks();
    });

    it('should return a client from the pool', async () => {
      const client = await service.getClient();

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(client).toBe(mockClient);
    });
  });

  describe('transaction method', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      jest.clearAllMocks();
    });

    it('should execute successful transaction with BEGIN and COMMIT', async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1 };

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce(mockResult) // User callback query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.transaction(async (client) => {
        return await client.query(
          'INSERT INTO test (name) VALUES ($1) RETURNING *',
          ['test'],
        );
      });

      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(
        2,
        'INSERT INTO test (name) VALUES ($1) RETURNING *',
        ['test'],
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should ROLLBACK when callback throws error', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockRejectedValueOnce(new Error('Database constraint violation')) // Query fails
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK

      await expect(
        service.transaction(async (client) => {
          return await client.query('INSERT INTO test (name) VALUES ($1)', [
            'duplicate',
          ]);
        }),
      ).rejects.toThrow('Database constraint violation');

      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should ROLLBACK when callback throws business logic error', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK

      await expect(
        service.transaction(async (_client) => {
          // Simulate business logic that throws
          throw new Error('Business rule violation');
        }),
      ).rejects.toThrow('Business rule violation');

      expect(mockClient.query).toHaveBeenCalledTimes(2);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should release client even if ROLLBACK fails', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockRejectedValueOnce(new Error('Query failed')) // User query fails
        .mockRejectedValueOnce(new Error('Rollback failed')); // ROLLBACK also fails

      await expect(
        service.transaction(async (client) => {
          return await client.query('INVALID SQL');
        }),
      ).rejects.toThrow('Rollback failed');

      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple queries in single transaction', async () => {
      const result1 = { rows: [{ id: 1 }], rowCount: 1 };
      const result2 = { rows: [{ id: 2 }], rowCount: 1 };

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce(result1) // First query
        .mockResolvedValueOnce(result2) // Second query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.transaction(async (client) => {
        const first = await client.query(
          'INSERT INTO users (name) VALUES ($1) RETURNING *',
          ['user1'],
        );
        const second = await client.query(
          'INSERT INTO profiles (user_id) VALUES ($1) RETURNING *',
          [1],
        );
        return { user: first, profile: second };
      });

      expect(mockClient.query).toHaveBeenCalledTimes(4);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');
      expect(result).toEqual({ user: result1, profile: result2 });
    });
  });
});
