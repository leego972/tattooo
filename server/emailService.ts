import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "tatt-ooo <noreply@tatt-ooo.com>";
const LOGO_URL = "https://cdn.manus.im/webdev-static-assets/tatt-ooo-logo.png";

// ─── Password Reset Email ─────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  toEmail: string,
  toName: string | null,
  resetUrl: string
): Promise<void> {
  const firstName = toName?.split(" ")[0] ?? "there";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: "Reset your tatt-ooo password",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #222222;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a 0%,#111827 100%);padding:32px 40px;text-align:center;border-bottom:1px solid #1e3a5f;">
              <div style="font-size:28px;font-weight:900;letter-spacing:0.05em;color:#ffffff;">
                tatt<span style="color:#06b6d4;">-ooo</span>
              </div>
              <div style="font-size:11px;letter-spacing:0.2em;color:#64748b;margin-top:4px;text-transform:uppercase;">AI Tattoo Designer</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f1f5f9;">
                Password Reset Request
              </h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">
                Hey ${firstName}, we received a request to reset the password for your tatt-ooo account.
                Click the button below to choose a new password.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(135deg,#0891b2,#0e7490);">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">
                This link expires in <strong style="color:#94a3b8;">1 hour</strong>.
                If you did not request a password reset, you can safely ignore this email.
              </p>
              <p style="margin:0;font-size:12px;color:#475569;word-break:break-all;">
                Or copy this link: <a href="${resetUrl}" style="color:#06b6d4;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                © ${new Date().getFullYear()} tatt-ooo · AI Tattoo Designer · Created by LEEGO
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

// ─── Artist Contact Email ─────────────────────────────────────────────────────

export async function sendArtistContactEmail(opts: {
  artistEmail: string;
  artistName: string;
  customerName: string;
  customerEmail: string;
  message: string;
  designUrl?: string;
}): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.artistEmail,
    replyTo: opts.customerEmail,
    subject: `New design inquiry from ${opts.customerName} via tatt-ooo`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New design inquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #222222;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a 0%,#111827 100%);padding:32px 40px;text-align:center;border-bottom:1px solid #1e3a5f;">
              <div style="font-size:28px;font-weight:900;letter-spacing:0.05em;color:#ffffff;">
                tatt<span style="color:#06b6d4;">-ooo</span>
              </div>
              <div style="font-size:11px;letter-spacing:0.2em;color:#64748b;margin-top:4px;text-transform:uppercase;">New Design Inquiry</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f1f5f9;">
                Hi ${opts.artistName},
              </h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">
                You have a new tattoo design inquiry from <strong style="color:#f1f5f9;">${opts.customerName}</strong> (${opts.customerEmail}) via tatt-ooo.
              </p>
              <div style="background:#1e293b;border-radius:8px;padding:20px;margin-bottom:24px;border-left:3px solid #06b6d4;">
                <p style="margin:0;font-size:14px;line-height:1.7;color:#cbd5e1;font-style:italic;">"${opts.message}"</p>
              </div>
              ${opts.designUrl ? `
              <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;">Their AI-generated design:</p>
              <a href="${opts.designUrl}" style="display:block;margin-bottom:24px;">
                <img src="${opts.designUrl}" alt="Tattoo design" style="max-width:100%;border-radius:8px;border:1px solid #334155;" />
              </a>
              ` : ""}
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(135deg,#0891b2,#0e7490);">
                    <a href="mailto:${opts.customerEmail}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Reply to ${opts.customerName}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                © ${new Date().getFullYear()} tatt-ooo · AI Tattoo Designer
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(toEmail: string, toName: string | null): Promise<void> {
  const firstName = toName?.split(" ")[0] ?? "there";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: "Welcome to tatt-ooo — Your AI Tattoo Designer 🎨",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to tatt-ooo</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #222222;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a 0%,#111827 100%);padding:32px 40px;text-align:center;border-bottom:1px solid #1e3a5f;">
              <div style="font-size:32px;font-weight:900;letter-spacing:0.05em;color:#ffffff;">
                tatt<span style="color:#06b6d4;">-ooo</span>
              </div>
              <div style="font-size:11px;letter-spacing:0.2em;color:#64748b;margin-top:4px;text-transform:uppercase;">AI Tattoo Designer</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f1f5f9;">
                Welcome, ${firstName}! 🎉
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#94a3b8;">
                Your account is ready. You have <strong style="color:#06b6d4;">5 free credits</strong> to start generating stunning tattoo designs powered by AI.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">
                Describe your idea, upload a reference image, choose your body placement and style — and watch the AI bring your vision to life in seconds.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(135deg,#0891b2,#0e7490);">
                    <a href="https://tatt-ooo.com/studio" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Start Designing →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background:#1e293b;border-radius:8px;padding:20px;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#f1f5f9;text-transform:uppercase;letter-spacing:0.05em;">What you can do:</p>
                <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">✦ Chat with AI to describe your tattoo idea</p>
                <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">✦ Upload reference images for inspiration</p>
                <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">✦ Choose from 40+ global tattoo styles</p>
                <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">✦ Preview on an avatar body before committing</p>
                <p style="margin:0;font-size:13px;color:#94a3b8;">✦ Download print-ready 300 DPI files for your artist</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                © ${new Date().getFullYear()} tatt-ooo · AI Tattoo Designer · Created by LEEGO
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

// ─── Outreach Email ───────────────────────────────────────────────────────────

export async function sendOutreachEmail(opts: {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
}): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: opts.subject,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #222222;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a 0%,#111827 100%);padding:32px 40px;text-align:center;border-bottom:1px solid #1e3a5f;">
              <div style="font-size:28px;font-weight:900;letter-spacing:0.05em;color:#ffffff;">
                tatt<span style="color:#06b6d4;">-ooo</span>
              </div>
              <div style="font-size:11px;letter-spacing:0.2em;color:#64748b;margin-top:4px;text-transform:uppercase;">AI Tattoo Designer</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;color:#94a3b8;font-size:15px;line-height:1.7;">
              ${opts.htmlBody}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                © ${new Date().getFullYear()} tatt-ooo · AI Tattoo Designer · Created by LEEGO
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#334155;">
                You're receiving this because you're a tattoo artist. <a href="[UNSUBSCRIBE_URL]" style="color:#475569;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

// ─── Artist Registration Confirmation ─────────────────────────────────────────
export async function sendArtistRegistrationConfirmation(
  toEmail: string,
  artistName: string
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: "Application Received — tatooo.shop",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #222222;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#0a0a0a 0%,#111827 100%);padding:32px 40px;text-align:center;border-bottom:1px solid #1e3a5f;">
            <div style="font-size:28px;font-weight:900;letter-spacing:0.05em;color:#ffffff;">tatt<span style="color:#06b6d4;">-ooo</span></div>
            <div style="font-size:11px;letter-spacing:0.2em;color:#64748b;margin-top:4px;text-transform:uppercase;">AI Tattoo Designer</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f1f5f9;">Application Received, ${artistName}! 🎉</h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#94a3b8;">
              Thank you for applying to join the <strong style="color:#06b6d4;">tatooo.shop</strong> artist directory. Your payment has been received and your application is now <strong style="color:#f59e0b;">pending review</strong>.
            </p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#94a3b8;">
              Our team will review your profile within <strong style="color:#f1f5f9;">2–3 business days</strong>. Once approved, your profile will be live and clients who've already designed their tattoo with AI will be referred directly to you.
            </p>
            <div style="background:#1e293b;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#f1f5f9;text-transform:uppercase;letter-spacing:0.05em;">What happens next:</p>
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">✦ Our team reviews your application (2–3 business days)</p>
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">✦ You receive an approval email with your profile link</p>
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">✦ Clients are matched to you based on style and location</p>
              <p style="margin:0;font-size:13px;color:#94a3b8;">✦ 15% commission only on first bookings — zero recurring fees</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
            <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} tatt-ooo · AI Tattoo Designer · tatooo.shop</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
