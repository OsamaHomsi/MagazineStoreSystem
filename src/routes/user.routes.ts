import { FastifyInstance } from 'fastify';
import { registerUser, loginUser, getProfile,updateUser,getPublicUserProfile } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.js';

export default async function userRoutes(app: FastifyInstance) {
  app.post('/signUp', registerUser);
  app.post('/login', loginUser);
  app.get('/profile', { preHandler: verifyToken }, getProfile);
  app.put('/update', { preHandler: verifyToken }, updateUser);
  app.get('/:id', getPublicUserProfile);

}
