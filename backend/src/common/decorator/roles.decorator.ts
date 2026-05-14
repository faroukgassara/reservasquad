import { SetMetadata } from '@nestjs/common';


export const ROLES_KEY = 'roles';

export const Roles = (data: { roles: string[] }) => SetMetadata(ROLES_KEY, data.roles);
