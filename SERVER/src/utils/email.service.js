import sendEmail from "../config/email.config.js";

export const sendOTPEmail = async (email, newOTP) => {
  try {
    const subject = "Your OTP from CareerNova_AI";

    const message = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CareerNova_AI - Password Reset OTP</title>
</head>

<body style="margin:0;padding:0;background-color:#030014;font-family:Arial,Helvetica,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#030014;padding:40px 15px;">
        <tr>
            <td align="center">

                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#1e1e2d;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);">

                    <!-- Header -->
                    <tr>
                        <td align="center" style="background:#6366f1;padding:35px 25px;">

                            <h1 style="margin:0 auto 10px auto;color:#ffffff;font-size:32px;letter-spacing:1px;font-weight:900;">
                                CareerNova_AI
                            </h1>

                            <p style="margin:12px 0 0;color:#e0e7ff;font-size:16px;line-height:24px;">
                                Your AI-Powered Career Assistant
                            </p>

                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px 35px;">

                            <h2 style="margin:0 0 20px;color:#f8fafc;font-size:28px;">
                                Password Reset Request
                            </h2>

                            <p style="margin:0 0 18px;color:#cbd5e1;font-size:16px;line-height:28px;">
                                Hi,
                            </p>

                            <p style="margin:0 0 25px;color:#cbd5e1;font-size:16px;line-height:28px;">
                                We received a request to reset the password for your
                                <strong style="color:#f8fafc;">CareerNova_AI</strong> account.
                                Use the One-Time Password (OTP) below to continue.
                            </p>

                            <!-- OTP Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">

                                        <div style="display:inline-block;background:#0f172a;border:2px dashed #818cf8;border-radius:12px;padding:18px 35px;margin:10px 0 25px;">

                                            <span style="font-size:38px;font-weight:bold;color:#818cf8;letter-spacing:12px;">
                                                ${newOTP}
                                            </span>
                                        </div> 
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 18px;color:#cbd5e1;font-size:16px;line-height:28px;">
                                This OTP is valid for
                                <strong style="color:#f8fafc;">5 minutes</strong>.
                            </p>

                            <p style="margin:0 0 18px;color:#cbd5e1;font-size:16px;line-height:28px;">
                                Please do not share this code with anyone. Our team will
                                never ask for your OTP.
                            </p>

                            <p style="margin:0;color:#cbd5e1;font-size:16px;line-height:28px;">
                                If you did not request this password reset, you can safely
                                ignore this email. Your account remains secure.
                            </p>

                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding:0 35px;">
                            <hr style="border:none;border-top:1px solid #334155;margin:0;">
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding:30px 35px;background:#0f172a;border-top:1px solid rgba(255,255,255,0.05);">

                            <h2 style="margin:0 auto 12px auto;color:#818cf8;font-size:24px;font-weight:800;">
                                CareerNova_AI
                            </h2>

                            <p style="margin:12px 0 0;color:#94a3b8;font-size:14px;line-height:24px;">
                                Resume Analysis • Interview Prep • AI Guidance
                            </p>

                            <p style="margin:20px 0 0;color:#64748b;font-size:12px;line-height:20px;">
                                © 2026 CareerNova_AI. All Rights Reserved.
                                <br>
                                This is an automated email. Please do not reply.
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
    `;

    await sendEmail(email, subject, message);
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};
