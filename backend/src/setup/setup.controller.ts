import { BadRequestException, ForbiddenException, Controller, Get, Query } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

/**
 * One-time admin bootstrap, reachable over HTTP so it can be triggered by
 * visiting a URL in the browser (useful on hosts like Railway's free tier
 * that don't give you an interactive shell to run prisma/create-admin.ts).
 *
 * Guarded by SETUP_SECRET so it can't be hit by a stranger who finds the
 * URL. Reads the actual admin username/password from ADMIN_USERNAME /
 * ADMIN_PASSWORD / ADMIN_ROLE env vars, exactly like create-admin.ts does,
 * so nothing sensitive is ever passed in the URL itself.
 *
 * Disabled automatically as soon as any staff account exists.
 */
@Controller('setup')
export class SetupController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('create-admin')
  async createAdmin(@Query('key') key: string) {
    if (!process.env.SETUP_SECRET || key !== process.env.SETUP_SECRET) {
      throw new BadRequestException('Invalid or missing key.');
    }

    // One-time only: once any staff account exists this endpoint is closed,
    // so it can never be used to reset an admin password afterwards.
    if ((await this.prisma.user.count()) > 0) {
      throw new ForbiddenException(
        'Setup already completed. This endpoint is disabled.',
      );
    }

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const rawRole = process.env.ADMIN_ROLE || 'super_admin';

    if (!username || !password) {
      throw new BadRequestException(
        'ADMIN_USERNAME and ADMIN_PASSWORD must be set as Railway variables first.',
      );
    }

    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(rawRole as UserRole)) {
      throw new BadRequestException(
        `Invalid ADMIN_ROLE "${rawRole}". Valid choices: ${validRoles.join(', ')}`,
      );
    }

    if (password.length < 8) {
      throw new BadRequestException(
        'ADMIN_PASSWORD must be at least 8 characters long.',
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.upsert({
      where: { username },
      update: { password: hashed, role: rawRole as UserRole },
      create: {
        username,
        password: hashed,
        name: 'Msimamizi Mkuu',
        role: rawRole as UserRole,
      },
    });

    return {
      message: 'Admin account tayari.',
      username: user.username,
      role: user.role,
    };
  }
}
