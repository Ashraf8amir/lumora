import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ResponseMessage } from '@/common/response';
import { ApiCommonErrors } from '@/infrastructure/swagger/decorators/api-common-errors.decorator';
import { ApiOkResponseWrapped } from '@/infrastructure/swagger/decorators/api-ok-response-wrapped.decorator';

import { CreateAdminDto } from './dto/create/create-admin.dto';
import { CreateCustomerDto } from './dto/create/create-customer.dto';
import { CreateStoreManagerDto } from './dto/create/create-store-manager.dto';
import { CreateTechnicianDto } from './dto/create/create-technician.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('customers')
  @ResponseMessage('Customer created successfully')
  @ApiOkResponseWrapped(UserResponseDto)
  @ApiCommonErrors(['BAD_REQUEST', 'CONFLICT'])
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.usersService.createCustomer(dto);
  }

  @Post('store-managers')
  @ResponseMessage('Store manager created successfully')
  @ApiOkResponseWrapped(UserResponseDto)
  @ApiCommonErrors(['BAD_REQUEST', 'CONFLICT'])
  createStoreManager(@Body() dto: CreateStoreManagerDto) {
    return this.usersService.createStoreManager(dto);
  }

  @Post('technicians')
  @ResponseMessage('Technician created successfully')
  @ApiOkResponseWrapped(UserResponseDto)
  @ApiCommonErrors(['BAD_REQUEST', 'CONFLICT'])
  createTechnician(@Body() dto: CreateTechnicianDto) {
    return this.usersService.createTechnician(dto);
  }

  @Post('admins')
  @ResponseMessage('Admin created successfully')
  @ApiOkResponseWrapped(UserResponseDto)
  @ApiCommonErrors(['BAD_REQUEST', 'CONFLICT'])
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.usersService.createAdmin(dto);
  }

  @Get()
  @ResponseMessage('Users retrieved successfully')
  @ApiOkResponseWrapped(UserResponseDto, { isArray: true })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('User retrieved successfully')
  @ApiOkResponseWrapped(UserResponseDto)
  @ApiCommonErrors(['NOT_FOUND'])
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('User updated successfully')
  @ApiOkResponseWrapped(UserResponseDto)
  @ApiCommonErrors(['NOT_FOUND', 'BAD_REQUEST'])
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCommonErrors(['NOT_FOUND'])
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
  }
}
