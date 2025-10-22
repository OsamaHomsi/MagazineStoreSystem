import { FastifyInstance } from 'fastify';
import { submitMagazine,updateMagazine ,listMyRequests,listMyMagazines,deleteMagazine,getMagazineDetails,listApprovedMagazines,deleteMagazineByAdmin,listSubscriberIdsForMagazine} from '../controllers/magazine.controller.js';
import { verifyToken } from '../middlewares/auth.js';

export default async function magazineRoutes(app: FastifyInstance) {
  app.post('/submit', { preHandler: verifyToken }, submitMagazine);
  app.put('/update/:id', { preHandler: verifyToken }, updateMagazine);
  app.get('/viewRequests', { preHandler: verifyToken }, listMyRequests);
  app.get('/viewMagazines', { preHandler: verifyToken }, listMyMagazines);
  app.delete('/delete/:id', { preHandler: verifyToken }, deleteMagazine);
  app.get('/viewMagazine/:id',  getMagazineDetails);
  app.get('/approved', { preHandler: verifyToken },listApprovedMagazines);
  app.delete('/admin/:id', { preHandler: verifyToken }, deleteMagazineByAdmin);
  app.get('/subscriptions/:id', listSubscriberIdsForMagazine);
}

