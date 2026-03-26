/**
 * Direct script to send English info pack emails to all AU/NZ studios.
 * Bypasses tRPC auth — calls the DB and email service directly via tsx.
 * Run with: node --loader tsx scripts/send-aunz-infopacks-direct.mjs
 */
import "dotenv/config";
import nodemailer from "nodemailer";
import mysql from "mysql2/promise";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL;
const ORIGIN = "https://tattooo.shop";
const FROM_EMAIL = `tatt-ooo <${GMAIL_USER ?? "noreply@tatt-ooo.com"}>`;

if (!GMAIL_USER) throw new Error("GMAIL_USER not set");
if (!GMAIL_APP_PASSWORD) throw new Error("GMAIL_APP_PASSWORD not set");
if (!DATABASE_URL) throw new Error("DATABASE_URL not set");

// Gmail SMTP transport — free, no API key required
// Generate an App Password at: https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

// Connect to DB
const db = await mysql.createConnection(DATABASE_URL);

// Get all AU/NZ studios with emails not yet sent
const [studios] = await db.execute(
  `SELECT id, studioName, email, country, language, unsubscribeToken 
   FROM studio_mailing_list 
   WHERE country IN ('Australia', 'New Zealand') 
     AND email IS NOT NULL AND email != '' 
     AND infoPackStatus = 'not_sent'
   ORDER BY id`
);

console.log(`Found ${studios.length} AU/NZ studios to email`);

let sent = 0;
let failed = 0;

for (const studio of studios) {
  try {
    const studioName = studio.studioName || "Studio";
    const email = studio.email;
    const unsubscribeToken = studio.unsubscribeToken || "";
    const unsubscribeUrl = unsubscribeToken
      ? `${ORIGIN}/api/unsubscribe/${unsubscribeToken}`
      : `${ORIGIN}/unsubscribe`;

    const subject = `Grow Your Tattoo Studio with AI — tatt-ooo Partnership`;
    const htmlBody = `
<p>Hi ${studioName} team,</p>

<p>My name is Lee, founder of <strong>tatt-ooo</strong> — an AI tattoo design platform at <a href="${ORIGIN}">${ORIGIN}</a>.</p>

<p>We help tattoo clients visualise their design ideas before they walk through your door. Instead of vague descriptions, clients arrive with a clear AI-generated design brief — saving you time and reducing back-and-forth revisions.</p>

<p><strong>What we offer your studio:</strong></p>
<ul>
  <li>List your studio in our global artist directory (${studio.country})</li>
  <li>Receive booking enquiries directly from clients who've already designed their tattoo</li>
  <li>Showcase your portfolio to thousands of tattoo enthusiasts</li>
  <li>Annual directory listing for just £29/year</li>
</ul>

<p>We're actively building our ${studio.country} artist network right now, and we'd love to feature your studio.</p>

<p><a href="${ORIGIN}/artist-signup" style="display:inline-block;padding:12px 28px;background:#06b6d4;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;">Join the tatt-ooo Directory →</a></p>

<p>Feel free to reply to this email with any questions — I personally read every response.</p>

<p>Best regards,<br/>
<strong>Lee</strong><br/>
Founder, tatt-ooo<br/>
<a href="${ORIGIN}">${ORIGIN}</a></p>

<p style="font-size:12px;color:#666;margin-top:32px;">
  You're receiving this because your studio was listed in our ${studio.country} tattoo directory research. 
  <a href="${unsubscribeUrl}">Unsubscribe</a>
</p>
`;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;background:#fff;color:#1a1a1a;">${htmlBody}</body></html>`,
    });

    // Mark as sent in DB
    await db.execute(
      `UPDATE studio_mailing_list SET infoPackStatus = 'sent', infoPackSentAt = NOW() WHERE id = ?`,
      [studio.id]
    );

    sent++;
    console.log(`✅ [${sent}/${studios.length}] Sent to ${studioName} <${email}>`);

    // 1.5s delay between sends to stay within Gmail rate limits
    await new Promise(r => setTimeout(r, 1500));
  } catch (err) {
    failed++;
    console.error(`❌ Failed for studio ID ${studio.id} (${studio.email}):`, err.message);
  }
}

await db.end();
console.log(`\n=== Done ===`);
console.log(`Sent: ${sent} | Failed: ${failed}`);
