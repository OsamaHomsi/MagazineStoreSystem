import { listPublishRequests ,approvePublishRequest ,rejectPublishRequest,getSinglePublishRequest} from '../services/publishRequest.service.js';
import { FastifyRequest, FastifyReply } from 'fastify';

export const getPublishRequests = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { status } = req.query as { status?: string };
    const role = (req as any).role;

    if (role !== 'admin') {
      return reply.code(403).send({ error: 'Access denied: Admins only' });
    }

    const requests = await listPublishRequests(status);
    reply.send({ requests });
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch publish requests' });
  }
};


export const approveRequest = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const role = (req as any).role;

    if (role !== 'admin') {
      return reply.code(403).send({ error: 'Access denied: Admins only' });
    }

    const result = await approvePublishRequest(id);
    reply.send({ message: 'Request approved', result });
  } catch (error: any) {
    reply.code(400).send({ error: error.message });
  }
};


export const rejectRequest = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };
    const role = (req as any).role;

    if (role !== 'admin') {
      return reply.code(403).send({ error: 'Access denied: Admins only' });
    }

    if (!reason || reason.trim().length === 0) {
      return reply.code(400).send({ error: 'Rejection reason is required' });
    }

    const result = await rejectPublishRequest(id, reason.trim());

    reply.send({
      message: 'Publish request rejected and email sent.',
      request: result,
    });
  } catch (error: any) {
    reply.code(500).send({ error: error.message });
  }
};



export const getPublishRequestById = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const user = (req as any).user;
    const role = (req as any).role;

    const request = await getSinglePublishRequest(id);
    console.log('User################:', user);
    console.log('Role################:', role);
    console.log('Fetched request:', request);
    if (!request) {
      return reply.code(404).send({ error: 'Publish request not found' });
    }

    const isOwner = request.publisherId === user.id;
    const isAdmin = role === 'admin';

    if (!isOwner && !isAdmin) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    reply.send({ request });
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch publish request' });
  }
};
