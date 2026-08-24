import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';

import { BusinessException, ErrorCode } from '@/common/exceptions';
import { createPaginationResult } from '@/common/response';

import { CreateCustomerDto } from './dto/create/create-customer.dto';
import { CreateStoreManagerDto } from './dto/create/create-store-manager.dto';
import { CreateTechnicianDto } from './dto/create/create-technician.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './repositories/users.repository';

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async createCustomer(dto: CreateCustomerDto) {
    return this.handleDuplicateKey(() => this.usersRepo.createCustomer(dto));
  }

  async createStoreManager(dto: CreateStoreManagerDto) {
    await this.ensureEmailIsUnique(dto.email);
    return this.handleDuplicateKey(() => this.usersRepo.createStoreManager(dto));
  }

  async createTechnician(dto: CreateTechnicianDto) {
    await this.ensureEmailIsUnique(dto.email);
    return this.handleDuplicateKey(() => this.usersRepo.createTechnician(dto));
  }

  async findAll(query: QueryUserDto) {
    const { items, page, limit, total } = await this.usersRepo.findAll(query);

    return {
      data: items,
      metadata: createPaginationResult(page, limit, total),
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findById(id);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  async update(id: string, dto: UpdateUserDto) {
    const updated = await this.usersRepo.updateById(id, dto);

    if (!updated) throw new NotFoundException('User not found');

    return updated;
  }

  async remove(id: string) {
    const user = await this.usersRepo.findById(id);

    if (!user) throw new NotFoundException('User not found');

    await user.softDelete();
  }

  private async handleDuplicateKey<T>(create: () => Promise<T>): Promise<T> {
    try {
      return await create();
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        const keyPattern = error.keyPattern || {};
        const fieldName = Object.keys(keyPattern)[0] || 'field';

        const formattedField =
          fieldName
            .replace(/([A-Z])/g, ' $1')
            .charAt(0)
            .toUpperCase() + fieldName.replace(/([A-Z])/g, ' $1').slice(1);

        throw new BusinessException(`${formattedField} already registered.`, {
          statusCode: HttpStatus.CONFLICT,
          errorCode: ErrorCode.DUPLICATE_ENTRY,
        });
      }

      throw error;
    }
  }

  private isDuplicateKeyError(error: unknown): error is {
    code: number;
    keyPattern?: Record<string, number>;
    keyValue?: Record<string, unknown>;
  } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === MONGO_DUPLICATE_KEY_ERROR_CODE
    );
  }

  async ensureEmailIsUnique(email: string): Promise<void> {
    const exists = await this.usersRepo.existsByEmail(email);

    if (exists) {
      throw new BusinessException('Email already registered', {
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }
  }
}
