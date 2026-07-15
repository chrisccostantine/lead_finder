import bcrypt from 'bcrypt';
import { Prisma, type User } from '@prisma/client';
import { AppError } from '../errors/app-error.js';
import { prisma } from '../lib/prisma.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { tokenService } from './token.service.js';

const HASH_ROUNDS = 12;

function publicUser(user: User) {
  return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt };
}

export class AuthService {
  async isRegistrationOpen() {
    return (await prisma.user.count()) === 0;
  }

  async register(input: RegisterInput) {
    const passwordHash = await bcrypt.hash(input.password, HASH_ROUNDS);
    const user = await prisma.$transaction(async (transaction) => {
      // Serialize initial setup attempts across backend instances.
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(734641921)`;
      if (await transaction.user.count()) throw new AppError(409, 'REGISTRATION_DISABLED', 'Initial registration has already been completed.');
      return transaction.user.create({ data: { email: input.email, name: input.name, passwordHash, role: 'ADMIN' } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return { token: tokenService.sign(user.id, user.role), user: publicUser(user) };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    return { token: tokenService.sign(user.id, user.role), user: publicUser(user) };
  }

  async currentUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'The authenticated user no longer exists.');
    return publicUser(user);
  }
}

export const authService = new AuthService();

