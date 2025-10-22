import { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import userRoutes from './routes/user.routes.js';
import magazineRoutes from './routes/magazine.routes.js';
import commentRoutes from './routes/comment.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import publishRequestRoutes from './routes/publishRequest.routes.js';

export default async function app(fastify: FastifyInstance) {
  fastify.register(fastifyMultipart);
  fastify.register(userRoutes, { prefix: '/users' });
  fastify.register(magazineRoutes, { prefix: '/magazines' });
  fastify.register(commentRoutes, { prefix: '/comments' });
  fastify.register(subscriptionRoutes, { prefix: '/subscription' });
  fastify.register(publishRequestRoutes, { prefix: '/publishRequests' });
}



