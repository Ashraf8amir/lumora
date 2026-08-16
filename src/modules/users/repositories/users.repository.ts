import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Role } from '@/common/enums/role.enum';

import { CreateAdminDto } from '../dto/create/create-admin.dto';
import { CreateCustomerDto } from '../dto/create/create-customer.dto';
import { CreateStoreManagerDto } from '../dto/create/create-store-manager.dto';
import { CreateTechnicianDto } from '../dto/create/create-technician.dto';
import { QueryUserDto } from '../dto/query-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AdminDocument } from '../schemas/discriminators/admin.schema';
import { CustomerDocument } from '../schemas/discriminators/customer.schema';
import { StoreManagerDocument } from '../schemas/discriminators/store-manager.schema';
import { TechnicianDocument } from '../schemas/discriminators/technician.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Role.CUSTOMER)
    private readonly customerModel: Model<CustomerDocument>,

    @InjectModel(Role.STORE_MANAGER)
    private readonly storeManagerModel: Model<StoreManagerDocument>,

    @InjectModel(Role.TECHNICIAN)
    private readonly technicianModel: Model<TechnicianDocument>,

    @InjectModel(Role.ADMIN)
    private readonly adminModel: Model<AdminDocument>,
  ) {}

  createCustomer(dto: CreateCustomerDto): Promise<CustomerDocument> {
    return this.customerModel.create({ ...dto, role: Role.CUSTOMER });
  }

  createStoreManager(dto: CreateStoreManagerDto): Promise<StoreManagerDocument> {
    return this.storeManagerModel.create({ ...dto, role: Role.STORE_MANAGER });
  }

  createTechnician(dto: CreateTechnicianDto): Promise<TechnicianDocument> {
    return this.technicianModel.create({ ...dto, role: Role.TECHNICIAN });
  }

  createAdmin(dto: CreateAdminDto): Promise<AdminDocument> {
    return this.adminModel.create({ ...dto, role: Role.ADMIN });
  }

  findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.userModel.exists({ email: email.toLowerCase() });
    return result !== null;
  }

  async findAll(query: QueryUserDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.role) filter.role = query.role;
    if (typeof query.isActive === 'boolean') filter.isActive = query.isActive;
    if (query.search) filter.$text = { $search: query.search };

    const [items, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return { items, page, limit, total };
  }

  updateById(id: string, dto: UpdateUserDto): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return this.userModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }
}
