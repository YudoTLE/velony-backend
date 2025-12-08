import { Exclude } from 'class-transformer';

import { UserResponseDto } from './user-response.dto';

@Exclude()
export class UserActiveResponseDto extends UserResponseDto {}
