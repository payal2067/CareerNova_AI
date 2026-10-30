import nodemailer from "nodemailer";

const sendEmail = async (to, subject, message) => {
  try {
    const user = process.env.GMAIL_USERNAME || process.env.EMAIL_USER;
    const pass = process.env.GMAIL_PASSCODE || process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.warn("⚠️ Email service skipped: GMAIL_USERNAME / EMAIL_USER or passcode not set.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });

    const mailOption = {
      from: `"CareerNova_AI" <${user}>`,
      to,
      subject,
      html: message,
    };

    const res = await transporter.sendMail(mailOption);
    console.log("Email sent successfully:", res.messageId);
    return res;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};

export default sendEmail;
