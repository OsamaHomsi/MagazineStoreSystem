import {
  getPublishRequests,
  approveRequest,
  rejectRequest,
  getPublishRequestById,
} from '../controllers/publishRequest.controller.js';
import { FastifyInstance } from 'fastify';
import { verifyToken } from '../middlewares/auth.js';

export default async function publishRequestRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: verifyToken }, getPublishRequests);
  app.put('/:id/approve', { preHandler: verifyToken }, approveRequest);
  app.put('/:id/reject', { preHandler: verifyToken }, rejectRequest);
  app.get('/:id', { preHandler: verifyToken }, getPublishRequestById);
}
