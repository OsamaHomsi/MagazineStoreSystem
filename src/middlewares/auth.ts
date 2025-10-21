import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export const verifyToken = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error('No token');

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: 'publisher' | 'admin' | 'subscriber';
    };

    (req as any).user = { id: decoded.userId };
    (req as any).role = decoded.role;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
};
