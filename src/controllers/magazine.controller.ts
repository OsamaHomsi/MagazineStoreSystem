import { FastifyRequest, FastifyReply } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import { createMagazineWithRequest ,updateMagazineIfPendingByRequestId,getMyRequests,getMyMagazines,deleteMagazineByPublisher,getMagazineById,getApprovedMagazines} from '../services/magazine.service';
import prisma from '../config/db';
import { logActivity } from '../services/activity.service';

type CustomMultipartValue = {
  fieldname: string;
  value: string;
};

function isFilePart(part: MultipartFile | CustomMultipartValue): part is MultipartFile {
  return 'file' in part;
}

function isValuePart(part: MultipartFile | CustomMultipartValue): part is CustomMultipartValue {
  return 'value' in part && 'fieldname' in part;
}

export const submitMagazine = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).role;

    if (role !== 'publisher') {
      return reply.code(403).send({ error: 'Access denied: Publishers only' });
    }

    const parts = req.parts() as AsyncIterableIterator<MultipartFile | CustomMultipartValue>;

    let title = '';
    let category = '';
    let content = '';
    let price = 0;
    let imagePaths: string[] = [];

    for await (const part of parts) {
      if ((part as any).file) {
        const buffer = await (part as any).toBuffer();
        const fileName = `${Date.now()}-${(part as any).filename}`;
        const filePath = require('path').join('uploads', fileName);
        await require('fs').promises.writeFile(filePath, buffer);
        imagePaths.push(filePath);
      } else {
        const fieldname = (part as any).fieldname;
        const value = (part as any).value;
        if (fieldname === 'title') title = value;
        if (fieldname === 'category') category = value;
        if (fieldname === 'content') content = value;
        if (fieldname === 'price') price = parseFloat(value);
      }
    }

    const { magazine, request } = await createMagazineWithRequest(
      title,
      category,
      content,
      price,
      imagePaths,
      userId
    );

    await logActivity(
      userId,
      'SUBMIT_PUBLISH_REQUEST',
      request.id,
      `Publisher submitted magazine: ${title}`
    );

    reply.code(201).send({
      message: 'Magazine submitted successfully',
      magazine,
      request,
    });
  } catch (error) {
    reply.code(500).send({ error: 'Failed to submit magazine', details: error });
  }
};


export const updateMagazine = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id: requestId } = req.params as { id: string };
    const userId = (req as any).user?.id;
    const role = (req as any).role;

    if (role !== 'publisher') {
      return reply.code(403).send({ error: 'Access denied: Publishers only' });
    }

    const parts = req.parts() as AsyncIterableIterator<MultipartFile | CustomMultipartValue>;

    let title: string | undefined;
    let category: string | undefined;
    let content: string | undefined;
    let price: number | undefined;
    let imagePaths: string[] = [];

    for await (const part of parts) {
      if (isFilePart(part)) {
        const buffer = await part.toBuffer();
        const fileName = `${Date.now()}-${part.filename}`;
        const filePath = path.join('uploads', fileName);
        await fs.promises.writeFile(filePath, buffer);
        imagePaths.push(filePath);
      } else if (isValuePart(part)) {
        const value = part.value.trim();
        if (part.fieldname === 'title' && value) title = value;
        if (part.fieldname === 'category' && value) category = value;
        if (part.fieldname === 'content' && value) content = value;
        if (part.fieldname === 'price' && !isNaN(parseFloat(value))) price = parseFloat(value);
      }
    }

    const updated = await updateMagazineIfPendingByRequestId(requestId, userId, {
      title,
      category,
      content,
      price,
      imagePaths: imagePaths.length > 0 ? imagePaths : undefined,
    });

    reply.send({ message: 'Magazine updated successfully', updated });
  } catch (error: any) {
    console.error('Update error:', error);
    reply.code(400).send({ error: error.message });
  }
};


export const listMyRequests = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).role;

    if (role !== 'publisher') {
      return reply.code(403).send({ error: 'Access denied: Publishers only' });
    }

    const { status, category, search, minPrice, maxPrice, title } = req.query as {
      status?: 'PENDING' | 'APPROVED' | 'REJECTED';
      category?: string;
      search?: string;
      title?: string;
      minPrice?: string;
      maxPrice?: string;
    };

    const requests = await getMyRequests(
      userId,
      status,
      category,
      search,
      title,
      minPrice ? parseFloat(minPrice) : undefined,
      maxPrice ? parseFloat(maxPrice) : undefined
    );

    reply.send({ requests });
  } catch (error) {
    console.error('listMyRequests error:', error);
    reply.code(500).send({ error: 'Failed to fetch requests ....' });
  }
};

export const listMyMagazines = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).role;

    if (role !== 'publisher') {
      return reply.code(403).send({ error: 'Access denied: Publishers only' });
    }

    const { category, title, minPrice, maxPrice } = req.query as {
      category?: string;
      title?: string;
      minPrice?: string;
      maxPrice?: string;
    };

    const magazines = await getMyMagazines(userId, {
      category,
      title,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });

    reply.send({ magazines });
  } catch (error) {
    console.error('listMyMagazines error:', error);
    reply.code(500).send({ error: 'Failed to fetch magazines....'});
  }
};


export const deleteMagazine = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const userId = (req as any).user?.id;
    const role = (req as any).role;

    if (role !== 'publisher') {
      return reply.code(403).send({ error: 'Access denied: Publishers only' });
    }

    const result = await deleteMagazineByPublisher(id, userId);

    await logActivity(
      userId,
      'DELETE_MAGAZINE',
      id,
      `Publisher deleted magazine with ID: ${id}`
    );

    reply.send(result);
  } catch (error: any) {
    console.error('Delete error:', error);
    reply.code(400).send({ error: error.message });
  }
};


export const getMagazineDetails = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };

    const magazine = await getMagazineById(id);

    reply.send({ magazine });
  } catch (error: any) {
    reply.code(404).send({ error: error.message });
  }
};

export const listApprovedMagazines = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query as {
      category?: string;
      minPrice?: string;
      maxPrice?: string;
      search?: string;
    };

    const filters = {
      category,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };

    const magazines = await getApprovedMagazines(filters);
    reply.send({ magazines });
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch approved magazines' });
  }
};

export const deleteMagazineByAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const role = (req as any).role;

    if (role !== 'admin') {
      return reply.code(403).send({ error: 'Access denied' });
    }

    const deleted = await prisma.magazine.delete({ where: { id } });

    reply.send({ message: 'Magazine deleted successfully', deleted });
  } catch (error) {
    reply.code(500).send({ error: 'Failed to delete magazine' });
  }
};

export const listSubscriberIdsForMagazine = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id: magazineId } = req.params as { id: string };

    if (!magazineId || magazineId.length !== 24) {
      return reply.code(400).send({ error: 'Invalid magazine ID' });
    }

    const subscriptions: { userId: string }[] = await prisma.subscription.findMany({
      where: { magazineId },
      select: { userId: true },
    });

    const subscriberIds: string[] = subscriptions.map((sub: { userId: string }) => sub.userId);

    reply.send({
      count: subscriberIds.length,
      subscriberIds,
    });
  } catch (error: any) {
    console.error('listSubscriberIdsForMagazine error:', error);
    reply.code(500).send({
      error: 'Failed to fetch subscriber IDs',
      details: error.message,
    });
  }
};



