import prisma from '../config/db.js';
import { sendMail } from '../utils/mailer.js';


const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;
type RequestStatus = typeof allowedStatuses[number];

export const listPublishRequests = async (status?: string) => {
  const statusEnum = status?.toUpperCase() as RequestStatus;

  if (statusEnum && !allowedStatuses.includes(statusEnum)) {
    throw new Error('Invalid status');
  }

  return prisma.publishRequest.findMany({
    where: statusEnum ? { status: statusEnum } : {},
    include: {
      magazine: {
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
          publisherId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const approvePublishRequest = async (requestId: string) => {
  const request = await prisma.publishRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error('Request not found');

  return prisma.publishRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      rejectionNote: null,
    },
  });
};


export const rejectPublishRequest = async (requestId: string, reason: string) => {
  if (!requestId || requestId.length !== 24) {
    throw new Error('Invalid request ID');
  }

  const request = await prisma.publishRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Publish request not found');
  }

  const updated = await prisma.publishRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      rejectionNote: reason,
    },
  });

  const [publisher, magazine] = await Promise.all([
    prisma.user.findUnique({ where: { id: request.publisherId } }),
    prisma.magazine.findUnique({ where: { id: request.magazineId } }),
  ]);

  if (publisher?.email && magazine?.title) {
    await sendMail(
      publisher.email,
      'طلب النشر مرفوض',
      `<p>مرحبًا ${publisher.name || 'ناشر'},</p>
       <p>تم رفض طلب نشر المجلة <strong>${magazine.title}</strong>.</p>
       <p>سبب الرفض: ${reason}</p>`
    );
  }

  return updated;
};


export const getSinglePublishRequest = async (requestId: string) => {
  return prisma.publishRequest.findFirst({
    where: { id: requestId },
    select: {
      id: true,
      publisherId: true, 
      status: true,
      rejectionNote: true,
      createdAt: true,
      magazine: {
        select: {
          id: true,
          title: true,
          category: true,
          content: true,
          price: true,
          image: true,
        },
      },
      publisher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};






