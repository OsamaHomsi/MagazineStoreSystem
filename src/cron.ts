import cron from 'node-cron';
import prisma from './config/db';
import nodemailer from 'nodemailer';

export const startCronJobs = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const subscriptionCount = await prisma.subscription.count({
        where: { createdAt: { gte: since } },
      });

      const publishRequestCount = await prisma.publishRequest.count({
        where: { createdAt: { gte: since } },
      });

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.ADMIN_EMAIL,
          pass: process.env.ADMIN_EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.ADMIN_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: '📊 التقرير اليومي للنظام',
        html: `
          <h2>📅 تقرير النظام خلال آخر 24 ساعة</h2>
          <ul>
            <li>📝 عدد الاشتراكات الجديدة: <strong>${subscriptionCount}</strong></li>
            <li>📤 عدد طلبات النشر الجديدة: <strong>${publishRequestCount}</strong></li>
          </ul>
          <p>🕒 وقت التقرير: ${new Date().toLocaleString()}</p>
        `,
      });

      console.log(`✅ تقرير يومي أُرسل بنجاح: اشتراكات ${subscriptionCount}, طلبات نشر ${publishRequestCount}`);
    } catch (err) {
      console.error('❌ فشل إرسال التقرير اليومي:', err);
    }
  });
};
