import nodemailer from "nodemailer";

let transporter;

export async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === "production") {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

export async function sendParticipantAddedEmail({
  toEmail,
  toUsername,
  tripTitle,
  ownerUsername,
}) {
  const t = await getTransporter();

  const subject = `You’ve been added to a trip: ${tripTitle}`;
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; line-height:1.5">
      <h2>Trip Shared with You</h2>
      <p><strong>${ownerUsername}</strong> added you to <strong>${tripTitle}</strong> on PlanIt.</p>
      <p>Log in to view or add plans.</p>
      <hr>
    </div>
  `;

  const info = await t.sendMail({
    from: process.env.MAIL_FROM || "PlanIt <noreply@planit.dev>",
    to: toEmail,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl?.(info);
  if (previewUrl) console.log("📧 Ethereal preview:", previewUrl);

  return info;
}
