// backend/tests/testmailer.js
import nodemailer from 'nodemailer';

async function main() {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  secure: false,
  ignoreTLS: true, // MailDev doesn’t require TLS
});


  const info = await transporter.sendMail({
    from: '"PlanIt App" <noreply@planit.dev>',
    to: 'test@user.com',
    subject: 'Nodemailer test',
    text: 'Hello from Nodemailer!',
    html: '<b>Hello from Nodemailer!</b>',
  });

  console.log('MessageId:', info.messageId);
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
}

main().catch(err => {
  console.error('Mailer error:', err);
  process.exit(1);
});
