/**
 * Script to send English info packs to all AU/NZ studios
 * Calls the sendInfoPackBatch tRPC procedure via HTTP
 * Must be run while the dev server is running
 */

const SERVER_URL = "http://localhost:3000";

// First, login as admin to get a session cookie
async function loginAsAdmin() {
  const res = await fetch(`${SERVER_URL}/api/trpc/auth.login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      json: {
        email: "leego972@gmail.com",
        password: "Hello123123",
      }
    }),
  });
  const data = await res.json();
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    console.error("Login failed - no cookie returned:", JSON.stringify(data));
    return null;
  }
  // Extract the session cookie
  const cookie = setCookie.split(";")[0];
  console.log("Logged in successfully, got cookie:", cookie.substring(0, 30) + "...");
  return cookie;
}

// Call sendInfoPackBatch with admin session
async function sendInfoPacks(cookie) {
  console.log("Calling sendInfoPackBatch for all AU/NZ studios...");
  const res = await fetch(`${SERVER_URL}/api/trpc/mailingList.sendInfoPackBatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie,
    },
    body: JSON.stringify({
      json: {
        origin: "https://tattooo.shop",
      }
    }),
  });
  const data = await res.json();
  console.log("Response status:", res.status);
  console.log("Result:", JSON.stringify(data, null, 2));
  return data;
}

async function main() {
  console.log("=== Sending AU/NZ Info Packs ===");
  
  const cookie = await loginAsAdmin();
  if (!cookie) {
    process.exit(1);
  }
  
  const result = await sendInfoPacks(cookie);
  
  if (result?.result?.data?.json) {
    const { sent, failed, errors } = result.result.data.json;
    console.log(`\n=== DONE ===`);
    console.log(`Sent: ${sent}`);
    console.log(`Failed: ${failed}`);
    if (errors && errors.length > 0) {
      console.log("Errors:", errors);
    }
  } else if (result?.error) {
    console.error("Error:", result.error.message || JSON.stringify(result.error));
  }
}

main().catch(console.error);
