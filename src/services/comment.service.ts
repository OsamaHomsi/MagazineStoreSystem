import prisma from '../config/db.js';

export const addComment = async (
  userId: string,
  magazineId: string,
  content: string
) => {
  return prisma.comment.create({
    data: {
      userId,
      magazineId,
      content,
    },
  });
};

export const getCommentsForMagazine = async (magazineId: string) => {
  return prisma.comment.findMany({
    where: { magazineId },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) throw new Error('Comment not found');
  if (comment.userId !== userId) throw new Error('Access denied');

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return { message: 'Comment deleted successfully' };
};

export const updateComment = async (
  commentId: string,
  userId: string,
  newContent: string
) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) throw new Error('Comment not found');
  if (comment.userId !== userId) throw new Error('Access denied');

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: newContent },
  });

  return updated;
};
