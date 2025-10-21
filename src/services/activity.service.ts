import prisma from '../config/db';

export const logActivity = async (
  userId: string,
  action: string,
  targetId?: string,
  details?: string
) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        targetId,
        details,
      },
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};
