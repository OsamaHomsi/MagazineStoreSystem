import { FastifyInstance } from 'fastify';
import { createSubscription, cancelSubscription } from '../controllers/subscription.controller';
import { verifyToken } from '../middlewares/auth';

export default async function subscriptionRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: verifyToken }, createSubscription);
  app.delete('/', { preHandler: verifyToken }, cancelSubscription);
}
