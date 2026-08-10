import * as winston from 'winston';
import { ClsServiceManager } from 'nestjs-cls';

export const addRequestId = winston.format((info) => {
  const cls = ClsServiceManager.getClsService();
  const requestId = cls?.getId?.();
  if (requestId) info.requestId = requestId;
  return info;
});
