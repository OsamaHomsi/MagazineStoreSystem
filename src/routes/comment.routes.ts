import { FastifyInstance } from 'fastify';
import { createComment, listComments,removeComment, editComment,deleteCommentByAdmin} from '../controllers/comment.controller.js';
import { verifyToken } from '../middlewares/auth.js';

export default async function commentRoutes(app: FastifyInstance) {
  app.post('/comment', { preHandler: verifyToken }, createComment);
  app.get('/:id',{ preHandler: verifyToken }, listComments);
  app.put('/:id', { preHandler: verifyToken }, editComment);
  app.delete('/:id', { preHandler: verifyToken }, removeComment);
  app.delete('/admin/:id', { preHandler: verifyToken }, deleteCommentByAdmin);
}
