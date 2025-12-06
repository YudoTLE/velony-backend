import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Post,
  Body,
} from '@nestjs/common';
import { IsBase64, IsString } from 'class-validator';
import { UserNotFoundException } from 'src/common/exceptions/user-not-found.excpetion';

class PostTestRequestDto {
  @IsString()
  encoded: string;
}

@Controller('test')
export class TestController {
  @Get()
  testGet() {
    // throw new NotFoundException('te');
    throw new UserNotFoundException();
  }

  @Post()
  testPost(@Body() dto: PostTestRequestDto) {
    console.log(dto);
  }
}
