// Standalone SMTP test. Run on the droplet from the app folder that holds .env.local:
//   node scripts/test-email.js aff.davis@gmail.com
// It loads SMTP_* from .env.local, sends one test message and prints the exact result/error.
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// --- load .env.local (Next.js loads it automatically, a plain node script does not) ---
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

const to = process.argv[2] || "aff.davis@gmail.com";
const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || `Test <${process.env.SMTP_USER}>`;

// --- Resend HTTPS API (preferred; works even when the host blocks outbound SMTP) ---
if (process.env.RESEND_API_KEY) {
  console.log("Provider: Resend (HTTPS API)");
  console.log("  from:", from);
  console.log("  to  :", to);
  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject: "Test email — reservation check", html: "<p>Test email from your server via <b>Resend</b>. It works ✅</p>" }),
  })
    .then(async (res) => {
      const body = await res.text();
      if (res.ok) {
        console.log("✅ Sent via Resend:", body);
      } else {
        console.error(`❌ Resend FAILED (${res.status}):`, body);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("❌ Resend request FAILED:", err && err.message ? err.message : err);
      process.exit(1);
    });
  return;
}

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log("Provider: SMTP");
console.log("  host:", host);
console.log("  port:", port, "secure:", port === 465);
console.log("  user:", user);
console.log("  pass:", pass ? `set (${pass.length} chars)` : "MISSING");
console.log("  from:", from);
console.log("  to  :", to);

if (!host || !user || !pass) {
  console.error("\n❌ SMTP_HOST / SMTP_USER / SMTP_PASS is missing in .env.local — email cannot be sent.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});

(async () => {
  try {
    console.log("\nVerifying SMTP login...");
    await transporter.verify();
    console.log("✅ SMTP login OK.");

    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Test email — reservation confirmation check",
      text: "This is a test email from your restaurant server. If you received it, SMTP works.",
      html: "<p>This is a <b>test email</b> from your restaurant server. If you received it, SMTP works. ✅</p>",
    });
    console.log("✅ Sent. messageId:", info.messageId);
    console.log("   accepted:", info.accepted);
    console.log("   rejected:", info.rejected);
    console.log("   response:", info.response);
  } catch (err) {
    console.error("\n❌ FAILED:", err && err.message ? err.message : err);
    if (err && err.code) console.error("   code:", err.code);
    if (err && err.responseCode) console.error("   responseCode:", err.responseCode);
    process.exit(1);
  }
})();
