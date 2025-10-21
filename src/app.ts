import { FastifyInstance } from 'fastify';
import userRoutes from './routes/user.routes';
import fastifyMultipart from '@fastify/multipart';
import magazineRoutes from './routes/magazine.routes';
import commentRoutes from './routes/comment.routes';
import subscriptionRoutes from './routes/subscription.routes';
import publishRequestRoutes from './routes/publishRequest.routes';

export default async function app(fastify: FastifyInstance) {
  fastify.register(fastifyMultipart);
  fastify.register(userRoutes, { prefix: '/users' });
  fastify.register(magazineRoutes, { prefix: '/magazines' });
  fastify.register(commentRoutes, { prefix: '/comments' });
  fastify.register(subscriptionRoutes, { prefix: '/subscription' });
  fastify.register(publishRequestRoutes, { prefix: '/publishRequests' });
}



