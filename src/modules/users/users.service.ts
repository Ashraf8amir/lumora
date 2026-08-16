import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { BusinessException, ErrorCode } from '@/common/exceptions';
import { HttpStatus } from '@nestjs/common';
import { createPaginationResult } from '@/common/response';

import { CreateAdminDto } from './dto/create/create-admin.dto';
import { CreateCustomerDto } from './dto/create/create-customer.dto';
import { CreateStoreManagerDto } from './dto/create/create-store-manager.dto';
import { CreateTechnicianDto } from './dto/create/create-technician.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async createCustomer(dto: CreateCustomerDto) {
    await this.ensureEmailIsUnique(dto.email);
    return this.usersRepo.createCustomer(dto);
  }

  async createStoreManager(dto: CreateStoreManagerDto) {
    await this.ensureEmailIsUnique(dto.email);
    return this.usersRepo.createStoreManager(dto);
  }

  async createTechnician(dto: CreateTechnicianDto) {
    await this.ensureEmailIsUnique(dto.email);
    return this.usersRepo.createTechnician(dto);
  }

  async createAdmin(dto: CreateAdminDto) {
    await this.ensureEmailIsUnique(dto.email);
    return this.usersRepo.createAdmin(dto);
  }

  async findAll(query: QueryUserDto) {
    const { items, page, limit, total } = await this.usersRepo.findAll(query);

    return {
      data: items,
      metadata: createPaginationResult(page, limit, total),
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('User not found');
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  async update(id: string, dto: UpdateUserDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('User not found');
    const updated = await this.usersRepo.updateById(id, dto);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('User not found');
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await user.softDelete();
  }

  private async ensureEmailIsUnique(email: string): Promise<void> {
    const exists = await this.usersRepo.existsByEmail(email);
    if (exists) {
      throw new BusinessException('Email already registered', {
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }
  }
}
