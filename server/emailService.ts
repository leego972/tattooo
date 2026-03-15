import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "tatt-ooo <noreply@tatt-ooo.com>";
const LOGO_URL = "https://cdn.manus.im/webdev-static-assets/tatt-ooo-logo.png";

// Password Reset Email

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

// Artist Contact Email

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

// Welcome Email

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

// Outreach Email

export async function sendOutreachEmail(opts: {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  attachmentUrl?: string;    // CDN URL of a PDF to attach
  attachmentName?: string;   // Filename shown to recipient
  unsubscribeToken?: string; // Token for one-click unsubscribe
  adImageUrl?: string;       // Optional inline ad image shown above body
}): Promise<void> {
  // Build attachments array if a PDF URL is provided
  type ResendAttachment = { filename: string; path: string };
  const attachments: ResendAttachment[] = [];
  if (opts.attachmentUrl) {
    attachments.push({
      filename: opts.attachmentName ?? "tattooo_info_pack.pdf",
      path: opts.attachmentUrl,
    });
  }
  const unsubscribeUrl = opts.unsubscribeToken
    ? `https://tattooo.shop/api/unsubscribe/${opts.unsubscribeToken}`
    : "#";
  const adImageHtml = opts.adImageUrl
    ? `<tr><td style="padding:0 40px 32px;"><img src="${opts.adImageUrl}" alt="tatt-ooo weekly" style="width:100%;border-radius:8px;display:block;" /></td></tr>`
    : "";
  await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: opts.subject,
    ...(attachments.length > 0 ? { attachments } : {}),
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
          ${adImageHtml}
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
                You're receiving this because you're a tattoo artist or studio. <a href="${unsubscribeUrl}" style="color:#475569;">Unsubscribe</a>
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

// Artist Registration Confirmation
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

// Promo Code Confirmation Email
export async function sendPromoConfirmationEmail(
  toEmail: string,
  toName: string | null,
  promoCode: string,
  discountPercent: number,
  bonusCredits: number
): Promise<void> {
  const firstName = toName?.split(" ")[0] ?? "there";
  const discountLine = discountPercent > 0 ? `<strong style="color:#06b6d4;">${discountPercent}% off</strong> your next credit purchase` : "";
  const bonusLine = bonusCredits > 0 ? `<strong style="color:#a78bfa;">+${bonusCredits} bonus credits</strong> added to your account` : "";
  const benefitLines = [discountLine, bonusLine].filter(Boolean).join(" and ");
  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Promo code ${promoCode} applied to your tatt-ooo account`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #222222;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0a0a0a 0%,#111827 100%);padding:32px 40px;text-align:center;border-bottom:1px solid #1e3a5f;">
          <div style="font-size:28px;font-weight:900;letter-spacing:0.05em;color:#ffffff;">tatt<span style="color:#06b6d4;">-ooo</span></div>
          <div style="font-size:11px;letter-spacing:0.2em;color:#64748b;margin-top:4px;text-transform:uppercase;">Promo Code Applied</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#0891b2,#7c3aed);border-radius:12px;padding:16px 28px;">
              <span style="font-size:22px;font-weight:900;letter-spacing:0.15em;color:#ffffff;font-family:monospace;">${promoCode}</span>
            </div>
          </div>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f1f5f9;text-align:center;">Promo Code Applied!</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;text-align:center;">Hey ${firstName}, your promo code is locked in. You'll receive ${benefitLines}.</p>
          ${discountPercent > 0 ? `<div style="background:#0c1a2e;border:1px solid #1e3a5f;border-radius:8px;padding:16px 20px;margin-bottom:16px;"><div style="font-size:13px;color:#64748b;margin-bottom:4px;">Discount on next purchase</div><div style="font-size:20px;font-weight:700;color:#06b6d4;">${discountPercent}% off</div></div>` : ""}
          ${bonusCredits > 0 ? `<div style="background:#130c2e;border:1px solid #3b1f6e;border-radius:8px;padding:16px 20px;margin-bottom:24px;"><div style="font-size:13px;color:#64748b;margin-bottom:4px;">Bonus credits added now</div><div style="font-size:20px;font-weight:700;color:#a78bfa;">+${bonusCredits} credits</div></div>` : ""}
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;"><tr><td style="border-radius:8px;background:linear-gradient(135deg,#0891b2,#0e7490);"><a href="https://tatt-ooo.manus.space/pricing" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Buy Credits Now</a></td></tr></table>
          <p style="margin:0;font-size:12px;color:#475569;text-align:center;">Discount applied automatically at checkout. Bonus credits are already in your account.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">&copy; ${new Date().getFullYear()} tatt-ooo &middot; AI Tattoo Designer &middot; Created by LEEGO</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim(),
  });
}


// Low Credit Alert Email
export async function sendLowCreditAlert(
  toEmail: string,
  toName: string | null,
  remainingCredits: number
): Promise<void> {
  const firstName = toName?.split(" ")[0] ?? "there";
  const subject = `Running low on credits — ${remainingCredits} left`;
  const body = [
    "<!DOCTYPE html><html><head><meta charset='UTF-8'/></head>",
    "<body style='margin:0;padding:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;'>",
    "<table width='100%' cellpadding='0' cellspacing='0' style='background:#0a0a0a;padding:40px 20px;'>",
    "<tr><td align='center'>",
    "<table width='560' cellpadding='0' cellspacing='0' style='background:#111111;border-radius:12px;border:1px solid #222;overflow:hidden;max-width:560px;width:100%;'>",
    "<tr><td style='background:linear-gradient(135deg,#1a0a00,#2d1100);padding:32px 40px;text-align:center;border-bottom:1px solid #7c2d12;'>",
    "<div style='font-size:28px;font-weight:900;color:#fff;'>tatt<span style='color:#f97316;'>-ooo</span></div>",
    "<div style='font-size:11px;letter-spacing:0.2em;color:#92400e;margin-top:4px;text-transform:uppercase;'>Low Credit Alert</div>",
    "</td></tr>",
    "<tr><td style='padding:40px;'>",
    `<h1 style='margin:0 0 12px;font-size:22px;font-weight:700;color:#f1f5f9;text-align:center;'>Running Low on Credits</h1>`,
    `<p style='margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;text-align:center;'>Hey ${firstName}, you only have <strong style='color:#f97316;'>${remainingCredits} credit${remainingCredits === 1 ? "" : "s"}</strong> remaining. Top up now so you don't get interrupted mid-design.</p>`,
    `<div style='background:#1a0a00;border:1px solid #7c2d12;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center;'>`,
    "<div style='font-size:13px;color:#92400e;margin-bottom:4px;'>Credits remaining</div>",
    `<div style='font-size:36px;font-weight:900;color:#f97316;'>${remainingCredits}</div>`,
    "</div>",
    "<table cellpadding='0' cellspacing='0' style='margin:0 auto 24px;'><tr><td style='border-radius:8px;background:linear-gradient(135deg,#ea580c,#c2410c);'>",
    "<a href='https://tatt-ooo.manus.space/pricing' style='display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;'>Top Up Credits</a>",
    "</td></tr></table>",
    "<p style='margin:0;font-size:12px;color:#475569;text-align:center;'>Or upgrade to a subscription plan for automatic monthly credit top-ups.</p>",
    "</td></tr>",
    `<tr><td style='padding:20px 40px;border-top:1px solid #1e293b;text-align:center;'><p style='margin:0;font-size:12px;color:#475569;'>&copy; ${new Date().getFullYear()} tatt-ooo &middot; AI Tattoo Designer &middot; Created by LEEGO</p></td></tr>`,
    "</table></td></tr></table></body></html>",
  ].join("\n");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject,
    html: body,
  });
}

export async function sendArtistTeamInviteEmail(
  toEmail: string,
  studioName: string,
  inviteUrl: string
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `You've been invited to join ${studioName} on tatt-ooo`,
    html: [
      "<!DOCTYPE html><html><head><meta charset='UTF-8'/></head>",
      "<body style='margin:0;padding:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;'>",
      "<table width='100%' cellpadding='0' cellspacing='0' style='background:#0a0a0a;padding:40px 20px;'>",
      "<tr><td align='center'>",
      "<table width='560' cellpadding='0' cellspacing='0' style='background:#111111;border-radius:12px;border:1px solid #222;overflow:hidden;max-width:560px;width:100%;'>",
      "<tr><td style='background:linear-gradient(135deg,#0c0a1e,#1a1040);padding:32px 40px;text-align:center;border-bottom:1px solid #2d1b69;'>",
      "<div style='font-size:28px;font-weight:900;color:#fff;'>tatt<span style='color:#a78bfa;'>-ooo</span></div>",
      "<div style='font-size:11px;letter-spacing:0.2em;color:#6d28d9;margin-top:4px;text-transform:uppercase;'>Team Invitation</div>",
      "</td></tr>",
      "<tr><td style='padding:40px;'>",
      "<h1 style='margin:0 0 12px;font-size:22px;font-weight:700;color:#f1f5f9;text-align:center;'>You're Invited!</h1>",
      `<p style='margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;text-align:center;'>You've been invited to join <strong style='color:#a78bfa;'>${studioName}</strong> as a team member on tatt-ooo. Complete your artist profile to get listed in our directory.</p>`,
      "<table cellpadding='0' cellspacing='0' style='margin:0 auto 24px;'><tr><td style='border-radius:8px;background:linear-gradient(135deg,#7c3aed,#6d28d9);'>",
      `<a href='${inviteUrl}' style='display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;'>Accept Invitation</a>`,
      "</td></tr></table>",
      "<p style='margin:0;font-size:12px;color:#475569;text-align:center;'>This invitation expires in 7 days. If you did not expect this, you can safely ignore it.</p>",
      "</td></tr>",
      `<tr><td style='padding:20px 40px;border-top:1px solid #1e293b;text-align:center;'><p style='margin:0;font-size:12px;color:#475569;'>&copy; ${new Date().getFullYear()} tatt-ooo &middot; AI Tattoo Designer &middot; Created by LEEGO</p></td></tr>`,
      "</table></td></tr></table></body></html>",
    ].join(""),
  });
}

// ── Send Design to Artist ─────────────────────────────────────────────────────
export async function sendDesignToArtistEmail(opts: {
  artistEmail: string;
  artistName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  designImageUrl: string;
  printImageUrl?: string;
  style?: string;
  bodyPlacement?: string;
  sizeLabel?: string;
  sizeInCm?: string;
  printSpec?: string;
  preferredDate?: string;
  notes?: string;
  bookingDepositAmount?: number;
}): Promise<void> {
  const specsRows = [
    opts.style && `<tr><td style="padding:8px 12px;color:#94a3b8;font-size:13px;border-bottom:1px solid #1e293b;width:140px;">Style</td><td style="padding:8px 12px;color:#f1f5f9;font-size:13px;font-weight:600;border-bottom:1px solid #1e293b;">${opts.style}</td></tr>`,
    opts.bodyPlacement && `<tr><td style="padding:8px 12px;color:#94a3b8;font-size:13px;border-bottom:1px solid #1e293b;">Placement</td><td style="padding:8px 12px;color:#f1f5f9;font-size:13px;font-weight:600;border-bottom:1px solid #1e293b;">${opts.bodyPlacement}</td></tr>`,
    opts.sizeLabel && `<tr><td style="padding:8px 12px;color:#94a3b8;font-size:13px;border-bottom:1px solid #1e293b;">Size</td><td style="padding:8px 12px;color:#f1f5f9;font-size:13px;font-weight:600;border-bottom:1px solid #1e293b;">${opts.sizeLabel}${opts.sizeInCm ? ` (${opts.sizeInCm})` : ""}</td></tr>`,
    opts.printSpec && `<tr><td style="padding:8px 12px;color:#94a3b8;font-size:13px;border-bottom:1px solid #1e293b;">Print Spec</td><td style="padding:8px 12px;color:#f1f5f9;font-size:13px;font-weight:600;border-bottom:1px solid #1e293b;">${opts.printSpec}</td></tr>`,
    opts.preferredDate && `<tr><td style="padding:8px 12px;color:#94a3b8;font-size:13px;border-bottom:1px solid #1e293b;">Preferred Date</td><td style="padding:8px 12px;color:#f1f5f9;font-size:13px;font-weight:600;border-bottom:1px solid #1e293b;">${opts.preferredDate}</td></tr>`,
    opts.customerPhone && `<tr><td style="padding:8px 12px;color:#94a3b8;font-size:13px;">Phone</td><td style="padding:8px 12px;color:#f1f5f9;font-size:13px;font-weight:600;">${opts.customerPhone}</td></tr>`,
  ].filter(Boolean).join("\n");

  const imageToShow = opts.printImageUrl || opts.designImageUrl;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.artistEmail,
    replyTo: opts.customerEmail,
    subject: `New Tattoo Design Request from ${opts.customerName} via tatt-ooo`,
    html: [
      "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'/><meta name='viewport' content='width=device-width,initial-scale=1.0'/><title>New Tattoo Design Request</title></head>",
      "<body style='margin:0;padding:0;background-color:#0a0a0a;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;'>",
      "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#0a0a0a;padding:40px 20px;'><tr><td align='center'>",
      "<table width='600' cellpadding='0' cellspacing='0' style='background-color:#111111;border-radius:12px;border:1px solid #222222;overflow:hidden;max-width:600px;width:100%;'>",
      // Header
      "<tr><td style='background:linear-gradient(135deg,#0a0a0a 0%,#111827 100%);padding:32px 40px;text-align:center;border-bottom:1px solid #1e3a5f;'>",
      "<div style='font-size:30px;font-weight:900;letter-spacing:0.05em;color:#ffffff;'>tatt<span style='color:#06b6d4;'>-ooo</span></div>",
      "<div style='font-size:11px;letter-spacing:0.2em;color:#64748b;margin-top:6px;text-transform:uppercase;'>New Appointment Request</div>",
      "</td></tr>",
      // Greeting
      "<tr><td style='padding:36px 40px 0;'>",
      `<h1 style='margin:0 0 8px;font-size:22px;font-weight:700;color:#f1f5f9;'>Hi ${opts.artistName},</h1>`,
      `<p style='margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;'><strong style='color:#f1f5f9;'>${opts.customerName}</strong> has sent you their AI-generated tattoo design and would like to book an appointment. All the details you need to prepare are below.</p>`,
      "</td></tr>",
      // Design Image
      "<tr><td style='padding:0 40px 28px;'>",
      "<p style='margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#06b6d4;'>Design (Print-Ready)</p>",
      `<a href='${imageToShow}' style='display:block;'><img src='${imageToShow}' alt='Tattoo design' style='width:100%;max-width:520px;border-radius:10px;border:1px solid #334155;display:block;'/></a>`,
      "<p style='margin:8px 0 0;font-size:11px;color:#475569;text-align:center;'>Click image to open full resolution &middot; 300 DPI print-ready</p>",
      "</td></tr>",
      // Specs
      specsRows ? [
        "<tr><td style='padding:0 40px 28px;'>",
        "<p style='margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#06b6d4;'>Specifications &amp; Booking Details</p>",
        "<table width='100%' cellpadding='0' cellspacing='0' style='background:#1e293b;border-radius:8px;overflow:hidden;border:1px solid #334155;'>",
        specsRows,
        "</table></td></tr>",
      ].join("") : "",
      // Notes
      opts.notes ? [
        "<tr><td style='padding:0 40px 28px;'>",
        "<p style='margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#06b6d4;'>Client Notes</p>",
        "<div style='background:#1e293b;border-radius:8px;padding:16px 20px;border-left:3px solid #06b6d4;'>",
        `<p style='margin:0;font-size:14px;line-height:1.7;color:#cbd5e1;font-style:italic;'>&ldquo;${opts.notes}&rdquo;</p>`,
        "</div></td></tr>",
      ].join("") : "",
      // CTA
      "<tr><td style='padding:0 40px 36px;'>",
      "<table cellpadding='0' cellspacing='0'><tr><td style='border-radius:8px;background:linear-gradient(135deg,#0891b2,#0e7490);'>",
      `<a href='mailto:${opts.customerEmail}?subject=Re: Your tattoo design request via tatt-ooo' style='display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;'>Reply to ${opts.customerName}</a>`,
      "</td></tr></table>",
      opts.bookingDepositAmount ? `<p style='margin:16px 0 0;font-size:12px;color:#64748b;'>Deposit required to confirm: <strong style='color:#f1f5f9;'>$${opts.bookingDepositAmount}</strong></p>` : "",
      "</td></tr>",
      // Footer
      `<tr><td style='padding:20px 40px;border-top:1px solid #1e293b;text-align:center;'><p style='margin:0;font-size:12px;color:#475569;'>Sent via <a href='https://tattooo.shop' style='color:#06b6d4;text-decoration:none;'>tattooo.shop</a> &middot; AI Tattoo Designer &middot; &copy; ${new Date().getFullYear()}</p></td></tr>`,
      "</table></td></tr></table></body></html>",
    ].join(""),
  });
}

// ── Booking Notification Emails ───────────────────────────────────────────────
export async function sendBookingNotificationEmail(opts: {
  to: string;
  toName: string;
  type: "new_request" | "confirmed" | "declined";
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  preferredDate?: string;
  notes?: string;
  artistName?: string;
  confirmedDate?: string;
  confirmedTime?: string;
  reason?: string;
  nextAvailableDate?: string;
  alternatives?: Array<{ id: number; name: string; city?: string | null; country?: string | null }>;
  bookingId?: number;
}): Promise<void> {
  const year = new Date().getFullYear();
  const headerStyle = "background:linear-gradient(135deg,#1a0a00,#2d1200);padding:32px 40px;border-bottom:2px solid #c0392b;";
  const logoHtml = "<h1 style='margin:0;font-size:28px;font-weight:900;letter-spacing:0.08em;color:#ffffff;font-family:Georgia,serif;'>TATT<span style='color:#c0392b;'>OOO</span></h1>";
  const footerHtml = `<tr><td style='padding:20px 40px;border-top:1px solid #2d1200;text-align:center;background:#0d0500;'><p style='margin:0;font-size:12px;color:#7f6050;'>Sent via <a href='https://tattooo.shop' style='color:#c0392b;text-decoration:none;'>tattooo.shop</a> &middot; AI Tattoo Designer &middot; &copy; ${year}</p></td></tr>`;
  const wrapStart = "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#0d0500;font-family:Arial,sans-serif;'><table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding:40px 20px;'><table width='600' cellpadding='0' cellspacing='0' style='background:#1a0a00;border-radius:12px;overflow:hidden;border:1px solid #2d1200;'>";
  const wrapEnd = footerHtml + "</table></td></tr></table></body></html>";

  let subject = "";
  let bodyRows = "";

  if (opts.type === "new_request") {
    subject = `New Booking Request from ${opts.customerName || "a customer"}`;
    bodyRows = [
      `<tr><td style='${headerStyle}'>${logoHtml}<p style='margin:8px 0 0;font-size:13px;color:#c0392b;letter-spacing:0.1em;text-transform:uppercase;'>New Booking Request</p></td></tr>`,
      `<tr><td style='padding:32px 40px;'>`,
      `<p style='margin:0 0 20px;font-size:17px;color:#f5e6d0;'>Hi <strong>${opts.toName}</strong>, you have a new booking request!</p>`,
      `<table width='100%' style='background:#0d0500;border-radius:8px;border:1px solid #2d1200;margin-bottom:20px;'>`,
      `<tr><td style='padding:14px 18px;border-bottom:1px solid #2d1200;'><div style='font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#c0392b;'>Customer</div><div style='font-size:16px;color:#f5e6d0;font-weight:700;margin-top:4px;'>${opts.customerName || ""}</div></td></tr>`,
      opts.customerEmail ? `<tr><td style='padding:12px 18px;border-bottom:1px solid #2d1200;'><div style='font-size:10px;color:#7f6050;text-transform:uppercase;letter-spacing:0.1em;'>Email</div><div style='font-size:14px;color:#f5e6d0;margin-top:4px;'>${opts.customerEmail}</div></td></tr>` : "",
      opts.customerPhone ? `<tr><td style='padding:12px 18px;border-bottom:1px solid #2d1200;'><div style='font-size:10px;color:#7f6050;text-transform:uppercase;letter-spacing:0.1em;'>Phone</div><div style='font-size:14px;color:#f5e6d0;margin-top:4px;'>${opts.customerPhone}</div></td></tr>` : "",
      opts.preferredDate ? `<tr><td style='padding:12px 18px;border-bottom:1px solid #2d1200;'><div style='font-size:10px;color:#7f6050;text-transform:uppercase;letter-spacing:0.1em;'>Preferred Date</div><div style='font-size:16px;color:#f5e6d0;font-weight:700;margin-top:4px;'>${opts.preferredDate}</div></td></tr>` : "",
      opts.notes ? `<tr><td style='padding:12px 18px;'><div style='font-size:10px;color:#7f6050;text-transform:uppercase;letter-spacing:0.1em;'>Notes</div><div style='font-size:14px;color:#f5e6d0;font-style:italic;margin-top:4px;'>"${opts.notes}"</div></td></tr>` : "",
      `</table>`,
      `<table cellpadding='0' cellspacing='0'><tr><td style='border-radius:8px;background:#c0392b;'><a href='https://tattooo.shop/artist-dashboard' style='display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;'>View in Dashboard &rarr;</a></td></tr></table>`,
      `</td></tr>`,
    ].join("");
  } else if (opts.type === "confirmed") {
    subject = `Your booking with ${opts.artistName || "your artist"} is confirmed!`;
    bodyRows = [
      `<tr><td style='${headerStyle}'>${logoHtml}<p style='margin:8px 0 0;font-size:13px;color:#27ae60;letter-spacing:0.1em;text-transform:uppercase;'>Booking Confirmed!</p></td></tr>`,
      `<tr><td style='padding:32px 40px;'>`,
      `<p style='margin:0 0 20px;font-size:17px;color:#f5e6d0;'>Great news, <strong>${opts.toName}</strong>! Your appointment is locked in.</p>`,
      `<table width='100%' style='background:#0d0500;border-radius:8px;border:1px solid #2d1200;margin-bottom:20px;'>`,
      `<tr><td style='padding:14px 18px;border-bottom:1px solid #2d1200;'><div style='font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#27ae60;'>Artist</div><div style='font-size:16px;color:#f5e6d0;font-weight:700;margin-top:4px;'>${opts.artistName || ""}</div></td></tr>`,
      opts.confirmedDate ? `<tr><td style='padding:12px 18px;'><div style='font-size:10px;color:#7f6050;text-transform:uppercase;letter-spacing:0.1em;'>Date &amp; Time</div><div style='font-size:18px;color:#f5e6d0;font-weight:700;margin-top:4px;'>${opts.confirmedDate}${opts.confirmedTime ? " at " + opts.confirmedTime : ""}</div></td></tr>` : "",
      `</table>`,
      `<p style='margin:0 0 20px;font-size:14px;color:#a08060;'>Bring your printed design to the appointment. See you there!</p>`,
      `<table cellpadding='0' cellspacing='0'><tr><td style='border-radius:8px;background:#c0392b;'><a href='https://tattooo.shop/my-bookings' style='display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;'>View My Bookings &rarr;</a></td></tr></table>`,
      `</td></tr>`,
    ].join("");
  } else {
    subject = `Booking Update from ${opts.artistName || "your artist"}`;
    const altHtml = opts.alternatives && opts.alternatives.length > 0
      ? `<p style='margin:20px 0 10px;font-size:14px;font-weight:700;color:#f5e6d0;'>Alternative Artists Near You:</p>` +
        opts.alternatives.map((a) =>
          `<div style='background:#0d0500;border:1px solid #2d1200;border-radius:8px;padding:12px 16px;margin-bottom:8px;'><strong style='color:#f5e6d0;'>${a.name}</strong> &mdash; <span style='color:#a08060;'>${a.city || ""}${a.city && a.country ? ", " : ""}${a.country || ""}</span><br><a href='https://tattooo.shop/artists/${a.id}' style='font-size:12px;color:#c0392b;'>View Profile &rarr;</a></div>`
        ).join("")
      : "";
    bodyRows = [
      `<tr><td style='${headerStyle}'>${logoHtml}<p style='margin:8px 0 0;font-size:13px;color:#e67e22;letter-spacing:0.1em;text-transform:uppercase;'>Booking Update</p></td></tr>`,
      `<tr><td style='padding:32px 40px;'>`,
      `<p style='margin:0 0 14px;font-size:17px;color:#f5e6d0;'>Hi <strong>${opts.toName}</strong>,</p>`,
      `<p style='margin:0 0 20px;font-size:15px;color:#a08060;'>${opts.artistName || "Your artist"} is unable to take your booking${opts.reason ? ` &mdash; "${opts.reason}"` : ""}.</p>`,
      opts.nextAvailableDate ? `<div style='background:#0d0500;border:1px solid #c0392b;border-radius:8px;padding:16px 20px;margin-bottom:20px;'><div style='font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#c0392b;'>Next Available Date</div><div style='font-size:20px;font-weight:700;color:#f5e6d0;margin-top:6px;'>${opts.nextAvailableDate}</div></div>` : "",
      altHtml,
      `<table cellpadding='0' cellspacing='0' style='margin-top:20px;'><tr><td style='border-radius:8px;background:#c0392b;'><a href='https://tattooo.shop/artists' style='display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;'>Browse All Artists &rarr;</a></td></tr></table>`,
      `</td></tr>`,
    ].join("");
  }

  await resend.emails.send({
    from: "Tattooo <noreply@tattooo.shop>",
    to: opts.to,
    subject,
    html: wrapStart + bodyRows + wrapEnd,
  });
}
