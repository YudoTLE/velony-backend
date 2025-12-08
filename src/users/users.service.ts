import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { ConversationNotFoundException } from 'src/common/exceptions/conversation-not-found.excpetion';
import { UserNotFoundException } from 'src/common/exceptions/user-not-found.excpetion';
import { ConversationsRepository } from 'src/conversations/conversations.repository';
import { StorageService } from 'src/storage/storage.service';
import { UserConversationsRepository } from 'src/user-conversations/user-conversations.repository';

import { GetDirtyUsersQueryDto } from './dto/get-dirty-users-query.dto';
import { UpdateUserPasswordRequestDto } from './dto/update-user-password-request.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly storageService: StorageService,
    private readonly usersRepository: UsersRepository,
    private readonly conversationsRepository: ConversationsRepository,
    private readonly userConversationsRepository: UserConversationsRepository,
  ) {}

  async findOneByUuid(uuid: string) {
    const user = await this.usersRepository.findOneBy('uuid', uuid, {
      fields: [
        'uuid',
        'name',
        'username',
        'email',
        'phone_number',
        'avatar_url',
        'created_at',
      ],
      deleted: false,
    });
    if (!user) throw new UserNotFoundException();

    return { user };
  }

  async findAllDirtyAfterCursorByConversationUuid(
    conversationUuid: string,
    requesterUuid: string,
    options: GetDirtyUsersQueryDto,
  ) {
    const [conversationId, requesterId] = await Promise.all([
      this.conversationsRepository
        .findOneBy('uuid', conversationUuid, { fields: ['id'] })
        .then((c) => {
          if (!c) throw new ConversationNotFoundException();
          return c.id;
        }),
      this.usersRepository
        .findOneBy('uuid', requesterUuid, { fields: ['id'] })
        .then((u) => {
          if (!u) throw new ConversationNotFoundException();
          return u.id;
        }),
    ]);

    const isAuthorized = await this.userConversationsRepository
      .findOne({
        userId: requesterId,
        conversationId,
      })
      .then((uc) => Boolean(uc));
    if (!isAuthorized) throw new ConversationNotFoundException();

    const users =
      await this.usersRepository.findAllDirtyAfterCursorByConversationId(
        conversationId,
        {
          cursor: options.cursor,
          limit: options.limit,
          fields: [
            'uuid',
            'name',
            'username',
            'email',
            'phone_number',
            'avatar_url',
            'created_at',

            'updated_at',
            'deleted_at',
            'version',
          ],
        },
      );

    const categorized = users.reduce(
      (acc, u) => {
        if (u.deleted_at !== null) {
          acc.inactive.push(u);
        } else {
          acc.active.push(u);
        }
        return acc;
      },
      {
        active: [] as typeof users,
        inactive: [] as typeof users,
      },
    );
    const version = users.at(-1)?.version;

    return {
      users: {
        ...(version !== undefined && { version }),
        ...categorized,
      },
    };
  }

  async updateUsername(userUuid: string, newUsername: string): Promise<string> {
    await this.usersRepository.updateOneBy('uuid', userUuid, {
      username: newUsername,
    });
    return newUsername;
  }

  async updateName(userUuid: string, newName: string): Promise<string> {
    await this.usersRepository.updateOneBy('uuid', userUuid, { name: newName });
    return newName;
  }

  async updateEmail(userUuid: string, newEmail: string): Promise<string> {
    await this.usersRepository.updateOneBy('uuid', userUuid, {
      email: newEmail,
    });
    return newEmail;
  }

  async updatePassword(
    userUuid: string,
    dto: UpdateUserPasswordRequestDto,
  ): Promise<string> {
    const passwordHash = await this.usersRepository
      .findOneBy('uuid', userUuid, { fields: ['password_hash'] })
      .then((u) => u?.password_hash);
    if (!passwordHash) throw new UserNotFoundException();

    let isOldPasswordValid = false;
    if (!passwordHash) {
      isOldPasswordValid = true;
    } else {
      if (dto.oldPassword) {
        isOldPasswordValid = await bcrypt.compare(
          dto.oldPassword,
          passwordHash,
        );
      }
    }
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.usersRepository.updateOneBy('uuid', userUuid, {
      password_hash: newPasswordHash,
    });
    return newPasswordHash;
  }

  async updateAvatar(userUuid: string, newAvatar: Buffer): Promise<string> {
    const key = `users/avatars/${userUuid}.png`;
    const url = await this.storageService.uploadFile(
      key,
      newAvatar,
      'image/png',
    );

    await this.usersRepository.updateOneBy('uuid', userUuid, {
      avatar_url: url,
    });
    return url;
  }
}
