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
    const [conversationId, requesterId, cursorUserId] = await Promise.all([
      this.conversationsRepository
        .findOneBy('uuid', conversationUuid, { fields: ['id'] })
        .then((c) => c?.id),
      this.usersRepository
        .findOneBy('uuid', requesterUuid, { fields: ['id'] })
        .then((u) => u?.id),
      options.cursor
        ? this.usersRepository
            .findOneBy('uuid', options.cursor.userId, { fields: ['id'] })
            .then((u) => u?.id)
        : Promise.resolve(undefined),
    ]);
    if (!conversationId || !requesterId)
      throw new ConversationNotFoundException();

    const [isAuthorized, isCursorUserBelongToConversation] = await Promise.all([
      this.userConversationsRepository
        .findOne({
          userId: requesterId,
          conversationId,
        })
        .then((uc) => Boolean(uc)),
      options.cursor
        ? this.userConversationsRepository
            .findOne({ userId: cursorUserId!, conversationId })
            .then((uc) => Boolean(uc))
        : Promise.resolve(true),
    ]);
    if (!isAuthorized) throw new ConversationNotFoundException();

    if (!isCursorUserBelongToConversation) throw new UserNotFoundException();

    const users =
      await this.usersRepository.findAllDirtyAfterCursorByConversationId(
        conversationId,
        {
          cursor: options.cursor
            ? {
                userId: cursorUserId!,
                updatedAt: options.cursor.updatedAt,
              }
            : undefined,
          limit: options.limit,
          fields: [
            'uuid',
            'name',
            'username',
            'email',
            'phone_number',
            'avatar_url',
            'created_at',

            'deleted_at',
          ],
        },
      );

    return { users };
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
