import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Role } from '@/common/enums/role.enum';

import { CreateCustomerDto } from '../dto/create/create-customer.dto';
import { CreateTechnicianDto } from '../dto/create/create-technician.dto';
import { CreateStoreManagerDto } from '../dto/create/create-store-manager.dto';
import { QueryUserDto } from '../dto/query-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

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
  ) {}

  createCustomer(dto: CreateCustomerDto): Promise<CustomerDocument> {
    return this.customerModel.create(dto);
  }

  createStoreManager(dto: CreateStoreManagerDto): Promise<StoreManagerDocument> {
    return this.storeManagerModel.create(dto);
  }

  createTechnician(dto: CreateTechnicianDto): Promise<TechnicianDocument> {
    const { profile, ...baseUserData } = dto;

    return this.technicianModel.create({
      ...baseUserData,
      role: Role.TECHNICIAN,
      profile: {
        skills: profile?.skills ?? [],
        certifications: profile?.certifications ?? [],
        yearsOfExperience: profile?.yearsOfExperience ?? 0,
        bio: profile?.bio,
      },
    });
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.userModel.exists({ email: email.toLowerCase() })) !== null;
  }

  async findAll(query: QueryUserDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.role) filter.role = query.role;

    if (typeof query.isActive === 'boolean') filter.isActive = query.isActive;

    const isTextSearch = Boolean(query.search?.trim());

    if (isTextSearch) filter.$text = { $search: query.search!.trim() };

    const projection = isTextSearch ? { score: { $meta: 'textScore' } } : {};
    const sort: any = isTextSearch ? { score: { $meta: 'textScore' } } : { createdAt: -1 };

    const [items, total] = await Promise.all([
      this.userModel.find(filter, projection).sort(sort).skip(skip).limit(limit).exec(),

      this.userModel.countDocuments(filter).exec(),
    ]);

    return { items, page, limit, total };
  }

  updateById(id: string, dto: UpdateUserDto): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .exec();
  }
}
