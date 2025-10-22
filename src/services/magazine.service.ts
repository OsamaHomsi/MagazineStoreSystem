import prisma from '../config/db.js';

export const createMagazineWithRequest = async (
  title: string,
  category: string,
  content: string,
  price: number,
  imagePaths: string[],
  publisherId: string
) => {
  const magazine = await prisma.magazine.create({
    data: {
      title,
      category,
      content,
      price,
      image: imagePaths,
      publisherId,
    },
  });

  const request = await prisma.publishRequest.create({
    data: {
      magazineId: magazine.id,
      publisherId,
      status: 'PENDING',
    },
  });

  return { magazine, request };
};

export const updateMagazineIfPendingByRequestId = async (
  requestId: string,
  publisherId: string,
  updates: {
    title?: string;
    category?: string;
    content?: string;
    price?: number;
    imagePaths?: string[];
  }
) => {
  const request = await prisma.publishRequest.findUnique({
    where: { id: requestId },
    include: { magazine: true },
  });

  if (!request) throw new Error('Request not found');
  if (request.publisherId !== publisherId) throw new Error('Access denied');
  if (request.status !== 'PENDING') throw new Error('Cannot edit approved/rejected magazine');

  const original = request.magazine;

  const updated = await prisma.magazine.update({
    where: { id: request.magazineId },
    data: {
      title: updates.title ?? original.title,
      category: updates.category ?? original.category,
      content: updates.content ?? original.content,
      price: updates.price ?? original.price,
      image: updates.imagePaths ?? original.image,
    },
  });

  return updated;
};


export const getMyRequests = async (
  publisherId: string,
  status?: 'PENDING' | 'APPROVED' | 'REJECTED',
  category?: string,
  search?: string,
  title?: string,
  minPrice?: number,
  maxPrice?: number
) => {
  const filters: any = { publisherId };
  if (status) filters.status = status;

  const magazineFilter: any = {};
  if (title) magazineFilter.title = { contains: title, mode: 'insensitive' };
  if (category) magazineFilter.category = category;
  if (search) {
    magazineFilter.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    magazineFilter.price = {};
    if (minPrice !== undefined) magazineFilter.price.gte = minPrice;
    if (maxPrice !== undefined) magazineFilter.price.lte = maxPrice;
  }

  return prisma.publishRequest.findMany({
    where: {
      publisherId,
      ...(Object.keys(magazineFilter).length > 0 && {
        magazine: magazineFilter,
      }),
    },
    include: {
      magazine: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getMyMagazines = async (
  publisherId: string,
  filters: {
    category?: string;
    title?: string;
    minPrice?: number;
    maxPrice?: number;
  }
) => {
  const magazineFilter: any = {
    publisherId,
    publishRequest: {
      status: 'APPROVED',
    },
  };

  if (filters.category) magazineFilter.category = filters.category;
  if (filters.title) {
    magazineFilter.title = { contains: filters.title, mode: 'insensitive' };
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    magazineFilter.price = {};
    if (filters.minPrice !== undefined) magazineFilter.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) magazineFilter.price.lte = filters.maxPrice;
  }

  return prisma.magazine.findMany({
    where: magazineFilter,
    orderBy: { createdAt: 'desc' },
    include: {
      publishRequest: true,
    },
  });
};


export const deleteMagazineByPublisher = async (
  magazineId: string,
  publisherId: string
) => {
  const magazine = await prisma.magazine.findUnique({
    where: { id: magazineId },
    include: { publishRequest: true },
  });

  if (!magazine) throw new Error('Magazine not found');
  if (magazine.publisherId !== publisherId) throw new Error('Access denied');

  // حذف الطلب إذا موجود
  if (magazine.publishRequest) {
    await prisma.publishRequest.delete({
      where: { id: magazine.publishRequest.id },
    });
  }

  // حذف المجلة نفسها
  await prisma.magazine.delete({ where: { id: magazineId } });

  return { message: 'Magazine deleted successfully' };
};

export const getMagazineById = async (magazineId: string) => {
  const magazine = await prisma.magazine.findUnique({
    where: { id: magazineId },
    include: {
      publisher: {
        select: { id: true, name: true, email: true }, // حسب ما عندك في موديل User
      },
      publishRequest: {
        select: { id: true, status: true, createdAt: true },
      },
    },
  });

  if (!magazine) throw new Error('Magazine not found');

  return magazine;
};

export const getApprovedMagazines = async (filters: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}) => {
  const { category, minPrice, maxPrice, search } = filters;

  return prisma.magazine.findMany({
    where: {
      publishRequest: {
        is: { status: 'APPROVED' },
      },
      ...(category && { category }),
      ...(minPrice && { price: { gte: minPrice } }),
      ...(maxPrice && { price: { lte: maxPrice } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      publisher: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};


