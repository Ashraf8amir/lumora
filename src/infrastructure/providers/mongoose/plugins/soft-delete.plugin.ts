import { Query, Schema } from 'mongoose';

export function softDeletePlugin(schema: Schema): void {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  });

  schema.pre<Query<unknown, unknown>>(/^find/, function (this) {
    const query = this.getQuery() as Record<string, unknown>;

    if (query.isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
  });

  schema.methods.softDelete = async function (this: any) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
  };

  schema.methods.forceDelete = async function () {
    return this.deleteOne();
  };
}
