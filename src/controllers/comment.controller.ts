import { FastifyRequest, FastifyReply } from 'fastify';
import {
  addComment,
  getCommentsForMagazine,
  deleteComment,
  updateComment,
} from '../services/comment.service';
import prisma from '../config/db';

export const createComment = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).user?.id;
    const { magazineId, content } = req.body as { magazineId: string; content: string };

    if (!content || !magazineId) {
      return reply.code(400).send({ error: 'Missing content or magazineId' });
    }

    const comment = await addComment(userId, magazineId, content);
    reply.code(201).send({ message: 'Comment added', comment });
  } catch (error: any) {
    console.error('Add comment error:', error);
    reply.code(500).send({ error: 'Failed to add comment', details: error.message });
  }
};

export const listComments = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const comments = await getCommentsForMagazine(id);
    reply.send({ comments });
  } catch (error: any) {
    console.error('List comments error:', error);
    reply.code(500).send({ error: 'Failed to fetch comments', details: error.message });
  }
};

export const removeComment = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const userId = (req as any).user?.id;

    const result = await deleteComment(id, userId);
    reply.send(result);
  } catch (error: any) {
    console.error('Delete comment error:', error);
    reply.code(400).send({ error: error.message });
  }
};

export const editComment = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const { content } = req.body as { content: string };
    const userId = (req as any).user?.id;

    if (!content || content.trim() === '') {
      return reply.code(400).send({ error: 'Content is required' });
    }

    const updated = await updateComment(id, userId, content.trim());
    reply.send({ message: 'Comment updated', updated });
  } catch (error: any) {
    console.error('Update comment error:', error);
    reply.code(400).send({ error: error.message });
  }
};

export const deleteCommentByAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const role = (req as any).role;

    if (role !== 'admin') {
      return reply.code(403).send({ error: 'Access denied' });
    }

    const deleted = await prisma.comment.delete({ where: { id } });
    reply.send({ message: 'Comment deleted successfully', deleted });
  } catch (error: any) {
    console.error('Admin delete error:', error);
    reply.code(500).send({ error: 'Failed to delete comment', details: error.message });
  }
};
