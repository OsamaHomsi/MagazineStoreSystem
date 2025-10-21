import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import app from './app';
import { logActivity } from './services/activity.service';
import { startCronJobs } from './cron';

const server = Fastify({ logger: true });

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
    await server.listen({ port: 3000 });
    console.log('🚀 Server is running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

startCronJobs();
start();
