import prisma from '../config/db';
import { sendMail } from '../utils/mailer';

export const subscribeToMagazine = async (userId: string, magazineId: string) => {
  if (!userId) throw new Error('User ID is missing');
  const existing = await prisma.subscription.findFirst({
    where: { userId, magazineId },
  });

  if (existing) throw new Error('Already subscribed');

  
  const subscription = await prisma.subscription.create({
    data: {
      user: { connect: { id: userId } },
      magazine: { connect: { id: magazineId } },
    },
  });

  const [user, magazine] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.magazine.findUnique({ where: { id: magazineId } }),
  ]);

  if (user?.email && magazine?.title) {
    await sendMail(
      user.email,
      'Subscription Confirmed',
      `<p>Hello ${user.name || 'Subscriber'},</p>
       <p>You have successfully subscribed to <strong>${magazine.title}</strong>.</p>
       <p>Thank you for using our magazine platform!</p>`
    );
  }

  return subscription;
};


export const unsubscribeFromMagazine = async (userId: string, magazineId: string) => {
  if (!userId) throw new Error('User ID is missing');

  const existing = await prisma.subscription.findFirst({
    where: { userId, magazineId },
  });

  if (!existing) throw new Error('Subscription not found');

  await prisma.subscription.delete({
    where: { id: existing.id },
  });

  return { message: 'Unsubscribed successfully' };
};

