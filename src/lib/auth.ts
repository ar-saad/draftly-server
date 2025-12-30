import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [process.env.APP_URL!],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, token }) => {
      try {
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

        const info = await transporter.sendMail({
          from: '"Draftly" <arsaad.dev@gmail.com>',
          to: user.email,
          subject: "Verify your email address",
          text: `
Hi ${user.name ?? "there"},

Thanks for signing up for Draftly.

Please verify your email address by visiting the link below:
${verificationUrl}

This link may expire soon.

If you did not create an account, you can safely ignore this email.

Regards,
Draftly Team
`.trim(),
          html: `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" style="max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td style="background-color:#111827; padding:20px; text-align:center;">
                <span style="color:#ffffff; font-size:22px; font-weight:600;">
                  Draftly
                </span>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px; color:#374151; font-size:14px; line-height:1.6;">
                <p style="margin:0 0 16px;">
                  Hi ${user.name ?? "there"},
                </p>

                <p style="margin:0 0 16px;">
                  Thanks for signing up for <strong>Draftly</strong>.
                  Please verify your email address to complete your registration.
                </p>

                <div style="text-align:center; margin:32px 0;">
                  <a
                    href="${verificationUrl}"
                    style="
                      display:inline-block;
                      padding:12px 24px;
                      background-color:#111827;
                      color:#ffffff;
                      text-decoration:none;
                      border-radius:6px;
                      font-size:14px;
                      font-weight:500;
                    "
                  >
                    Verify Email
                  </a>
                </div>

                <p style="margin:0 0 16px;">
                  If the button above does not work, copy and paste the following link into your browser:
                </p>

                <p style="margin:0 0 16px; font-size:13px; word-break:break-all;">
                  <a href="${verificationUrl}" style="color:#2563eb;">
                    ${verificationUrl}
                  </a>
                </p>

                <p style="margin:0 0 16px;">
                  This verification link will expire soon for security reasons. If you did not create an account, you can safely ignore this email.
                </p>

                <p style="margin:24px 0 0;">
                  Regards,<br />
                  <strong>Draftly Team</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} Draftly. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
        });

        console.log("Verification email sent:", info.messageId);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  },
});
