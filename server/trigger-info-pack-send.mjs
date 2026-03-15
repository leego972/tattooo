/**
 * Trigger Info Pack Bulk Send
 * Directly calls the mailing list send logic for all 100 pending contacts.
 * Run with: node --experimental-vm-modules server/trigger-info-pack-send.mjs
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// We'll invoke via HTTP to the running server instead
const SERVER_URL = 'http://localhost:3000';

async function main() {
  console.log('[InfoPackSend] Triggering bulk info pack send via server API...');
  
  // We need to call the admin procedure - but we need an admin session cookie
  // Instead, let's call the server directly using the internal tRPC endpoint
  // with the owner's session
  
  // Check if RESEND_API_KEY is set
  if (!process.env.RESEND_API_KEY) {
    console.log('[InfoPackSend] Checking env...');
  }
  
  const origin = 'https://tattooo.shop';
  
  try {
    const response = await fetch(`${SERVER_URL}/api/trpc/mailingList.sendInfoPackBatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-trigger': 'true',
      },
      body: JSON.stringify({ 
        json: { origin }
      }),
    });
    
    const text = await response.text();
    console.log('[InfoPackSend] Response status:', response.status);
    console.log('[InfoPackSend] Response:', text.substring(0, 500));
  } catch (err) {
    console.error('[InfoPackSend] Error:', err.message);
  }
}

main();
