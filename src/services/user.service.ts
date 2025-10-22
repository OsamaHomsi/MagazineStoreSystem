import prisma from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/hash.js';

export const createUser = async (
  email: string,
  password: string,
  role: string,
  name?: string,
  avatar?: string
) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Email already exists');
  }

  const hashed = await hashPassword(password);

  return prisma.user.create({
    data: {
      email,
      password: hashed,
      role,
      createdAt: new Date(),
      ...(name !== undefined ? { name } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    },
  });
};



export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const validateUser = async (email: string, plainPassword: string) => {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const isMatch = await comparePassword(plainPassword, user.password);
  return isMatch ? user : null;
};
