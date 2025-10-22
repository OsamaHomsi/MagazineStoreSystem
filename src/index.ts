import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import app from './app.js';
import { logActivity } from './services/activity.service.js';
import { startCronJobs } from './cron.js';


const server = Fastify({ logger: true });

await server.register(cors, {
  origin: '*',
  credentials: true,
});

server.addHook('onRequest', async (request: FastifyRequest) => {
  (request as any).startTime = Date.now();
});

server.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const method = request.method;
    const url = request.url;
    const statusCode = reply.statusCode;
    const startTime = (request as any).startTime || Date.now();
    const responseTime = Date.now() - startTime;
    const userId = (request as any).user?.id || 'anonymous';

    await logActivity(
      userId,
      `API_CALL ${method} ${url}`,
      undefined,
      `Status: ${statusCode}, Time: ${responseTime}ms`
    );
  } catch (err) {
    console.error('Failed to log API call:', err);
  }
});

server.register(app);

const start = async () => {
  try {
    const PORT = Number(process.env.PORT) || 3000;
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

startCronJobs();
start();
