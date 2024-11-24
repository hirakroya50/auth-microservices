import { SetMetadata } from '@nestjs/common';
import { userRoleType } from 'src/types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: userRoleType[]) =>
  SetMetadata(ROLES_KEY, roles);
