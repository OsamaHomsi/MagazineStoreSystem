import { FastifyReply, FastifyRequest } from 'fastify';
import { createUser, validateUser } from '../services/user.service';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import type { MultipartFile } from '@fastify/multipart';
import prisma from '../config/db'; 
import { hashPassword } from '../utils/hash';

type CustomMultipartValue = {
  fieldname: string;
  value: string;
};

function isFilePart(part: MultipartFile | CustomMultipartValue): part is MultipartFile {
  return 'file' in part;
}

function isValuePart(part: MultipartFile | CustomMultipartValue): part is CustomMultipartValue {
  return 'value' in part && 'fieldname' in part;
}

const ALLOWED_MIMES = [
'image/jpeg',
'image/png',
'image/webp',
'image/gif',
'image/svg+xml',
'image/heic',
'image/heif',
];

export const registerUser = async (req: FastifyRequest, reply: FastifyReply) => {
try {
    const parts = req.parts() as AsyncIterableIterator<MultipartFile | CustomMultipartValue>;

    let email = '';
    let password = '';
    let role: 'admin' | 'publisher' | 'subscriber' = 'subscriber';
    let name: string | undefined;
    let avatarFilename: string | undefined;

    for await (const part of parts) {
    if (isFilePart(part)) {
        if (!ALLOWED_MIMES.includes(part.mimetype)) {
        part.file.resume();
        return reply.code(400).send({ error: 'Unsupported image type' });
        }

        const buffer = await part.toBuffer();
        const uploadPath = path.join(__dirname, '../../uploads', part.filename);
        fs.writeFileSync(uploadPath, buffer);
        avatarFilename = part.filename;
    } else if (isValuePart(part)) {
        if (part.fieldname === 'email') email = part.value;
        if (part.fieldname === 'password') password = part.value;
        if (part.fieldname === 'role') {
        const value = part.value.toLowerCase();
         if (value === 'publisher') {
         role = 'publisher';
         } else {
        role = 'subscriber'; 
  }
}

        if (part.fieldname === 'name') name = part.value;
    }
    }

    const user = await createUser(email, password, role, name, avatarFilename);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    reply.code(201).send({
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error raw:', error);
    if ((error as any).name === 'PrismaClientKnownRequestError') {
      console.error('prisma error code:', (error as any).code);
    }
    reply.code(500).send({ error: 'Registration failed', details: error });
  }
};

export const loginUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const user = await validateUser(email, password);
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    reply.send({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    reply.code(500).send({ error: 'Login failed', details: error });
  }
};

export const getProfile = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId || userId.length !== 24) {
      return reply.code(400).send({ error: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        avatar: true,
        role: true,
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    reply.send({
      message: 'User profile',
      user,
    });
  } catch (error: any) {
    console.error('Profile error:', error);
    reply.code(500).send({ error: 'Failed to fetch profile', details: error.message });
  }
};


export const updateUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId || userId.length !== 24) {
      return reply.code(400).send({ error: 'Invalid user ID' });
    }

    const parts = req.parts() as AsyncIterableIterator<MultipartFile | CustomMultipartValue>;

    let name: string | undefined;
    let password: string | undefined;
    let avatarUrl: string | undefined;

    for await (const part of parts) {
      if (isFilePart(part)) {
        if (!ALLOWED_MIMES.includes(part.mimetype)) {
          part.file.resume();
          return reply.code(400).send({ error: 'Unsupported image type' });
        }

        const buffer = await part.toBuffer();
        const fileName = `${Date.now()}-${part.filename}`;
        const filePath = `uploads/${fileName}`;

        await fs.promises.writeFile(filePath, buffer);
        avatarUrl = filePath;
      } else if (isValuePart(part)) {
        if (part.fieldname === 'name') name = part.value;
        if (part.fieldname === 'password') password = part.value;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (avatarUrl) updateData.avatar = avatarUrl;
    if (password) updateData.password = await hashPassword(password);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    reply.send({
      message: 'User updated successfully',
      user: updated,
    });
  } catch (error: any) {
    console.error('Update error:', error);
    reply.code(500).send({ error: 'Failed to update user', details: error.message });
  }
};


export const getRequests = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { status, publisherId, category, search, from, to } = req.query as {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    publisherId?: string;
    category?: string;
    search?: string;
    from?: string;
    to?: string;
    };

    const filters: any = {};

    if (status) filters.status = status;
    if (publisherId) filters.publisherId = publisherId;
    if (from || to) {
    filters.createdAt = {};
    if (from) filters.createdAt.gte = new Date(from);
    if (to) filters.createdAt.lte = new Date(to);
    }

    const requests = await prisma.publishRequest.findMany({
    where: {
        ...filters,
        magazine: {
        ...(category ? { category } : {}),
        ...(search
            ? {
                OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}),
        },
      },
      include: {
        magazine: true,
        publisher: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    reply.send({ requests });
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch requests', details: error });
  }
};


export const getPublicUserProfile = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };

    if (!id || id.length !== 24) {
      return reply.code(400).send({ error: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    reply.send({ profile: user });
  } catch (error: any) {
    console.error('getPublicUserProfile error:', error);
    reply.code(500).send({ error: 'Failed to fetch user profile', details: error.message });
  }
};
