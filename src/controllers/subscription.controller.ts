import { subscribeToMagazine, unsubscribeFromMagazine } from '../services/subscription.service.js';
import { FastifyRequest, FastifyReply } from 'fastify';
import { logActivity } from '../services/activity.service.js';
import prisma from '../config/db.js';

export const createSubscription = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).user?.id;
    const { magazineId } = req.body as { magazineId: string };

    if (!magazineId) {
      return reply.code(400).send({ error: 'Magazine ID is required' });
    }

    const subscription = await subscribeToMagazine(userId, magazineId);

    const magazine = await prisma.magazine.findUnique({ where: { id: magazineId } });

    await logActivity(
      userId,
      'SUBSCRIBE_MAGAZINE',
      magazineId,
      `User subscribed to magazine: ${magazine?.title || 'Unknown'}`
    );

    reply.code(201).send({ message: 'Subscribed successfully', subscription });
  } catch (error: any) {
    console.error('Subscribe error:', error);
    reply.code(400).send({ error: error.message });
  }
};


export const cancelSubscription = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).user?.id;
    const { magazineId } = req.body as { magazineId: string };

    if (!magazineId) {
      return reply.code(400).send({ error: 'Magazine ID is required' });
    }

    const result = await unsubscribeFromMagazine(userId, magazineId);
    reply.send(result);
  } catch (error: any) {
    console.error('Unsubscribe error:', error);
    reply.code(400).send({ error: error.message });
  }
};
