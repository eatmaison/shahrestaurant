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
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || `Test <${user}>`;

console.log("SMTP config:");
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
