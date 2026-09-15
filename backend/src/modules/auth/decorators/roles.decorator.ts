import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
// Attach on a controller/handler: @Roles(Role.ADMIN, Role.SUPER_ADMIN)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
