import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const CLINIC_NAME = "Niche Healthcare Limited";
const FROM_EMAIL = "invoices@nichehealthcare.co.zm";
const FROM_NAME = "Niche Healthcare";

// ── Send invoice via SendGrid email ────────────────────────────────────────
export const sendInvoiceEmail = action({
  args: {
    toEmail: v.string(),
    toName: v.string(),
    invoiceNumber: v.string(),
    patientName: v.string(),
    total: v.number(),
    dueDate: v.number(),
    lineItemsSummary: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error("[NOTIFY] SENDGRID_API_KEY not configured");
      return { success: false, error: "Email service not configured. Please add SENDGRID_API_KEY to Convex environment variables." };
    }

    const dueStr = new Date(args.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const totalStr = `K ${Number(args.total).toLocaleString()}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #1A1A2E; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #3B4B8A; padding: 28px 32px; }
        .logo { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: 1px; }
        .tagline { color: rgba(255,255,255,0.7); font-size: 12px; margin-top: 4px; }
        .body { padding: 28px 32px; }
        .invoice-box { background: #f0f2f8; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .invoice-number { font-size: 20px; font-weight: 700; color: #3B4B8A; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .label { color: #888; }
        .divider { border: none; border-top: 1px solid #eee; margin: 16px 0; }
        .total { font-size: 18px; font-weight: 700; color: #3B4B8A; }
        .cta { background: #3B4B8A; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 20px; }
        .footer { background: #f8f9fc; padding: 16px 32px; text-align: center; font-size: 11px; color: #aaa; }
      </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${CLINIC_NAME}</div>
            <div class="tagline">Professional Healthcare Services</div>
          </div>
          <div class="body">
            <p>Dear ${args.patientName},</p>
            <p style="margin-top:12px;">Please find your invoice details below. Payment is due by <strong>${dueStr}</strong>.</p>
            <div class="invoice-box">
              <div class="invoice-number">${args.invoiceNumber}</div>
              <hr class="divider">
              <div class="row"><span class="label">Items</span><span>${args.lineItemsSummary}</span></div>
              <hr class="divider">
              <div class="row"><span class="label">Total Due</span><span class="total">${totalStr}</span></div>
              <div class="row"><span class="label">Due Date</span><span>${dueStr}</span></div>
            </div>
            ${args.notes ? `<p style="color:#555;font-size:13px;"><strong>Notes:</strong> ${args.notes}</p>` : ""}
            <p style="margin-top:20px;font-size:13px;">For queries, please contact us at <a href="mailto:info@nichehealthcare.co.zm">info@nichehealthcare.co.zm</a></p>
          </div>
          <div class="footer">
            ${CLINIC_NAME} &bull; Lusaka, Zambia<br>
            This is an automated invoice email.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: args.toEmail, name: args.toName }] }],
          from: { email: FROM_EMAIL, name: FROM_NAME },
          subject: `Invoice ${args.invoiceNumber} from ${CLINIC_NAME}`,
          content: [{ type: "text/html", value: htmlBody }],
        }),
      });

      if (response.status === 202 || response.status === 200) {
        console.log(`[NOTIFY] Invoice email sent to ${args.toEmail}`);
        return { success: true };
      } else {
        const body = await response.text();
        console.error(`[NOTIFY] SendGrid error ${response.status}: ${body}`);
        return { success: false, error: `Email failed (${response.status}). Check SendGrid config.` };
      }
    } catch (e: any) {
      console.error("[NOTIFY] Email action error:", e);
      return { success: false, error: e.message };
    }
  },
});

// ── Send OTP verification code via SendGrid ─────────────────────────────────
export const sendOTPCode = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error("[NOTIFY] SENDGRID_API_KEY not configured");
      return { success: false, error: "Email service not configured." };
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@nichehealthcare.co.zm";

    let otpData: { code: string; name: string; expiry: number };
    try {
      otpData = await ctx.runMutation(internal.auth.storeOTPCode, { email: args.email });
    } catch (e: any) {
      return { success: false, error: e.message || "Account not found" };
    }

    const { code, name } = otpData;
    const digits = code.split("");

    const htmlBody = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${code} is your NHL Connect verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f6fb">
  <tr><td align="center" style="padding:40px 16px;">

    <!-- Card -->
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:12px;">

      <!-- Header -->
      <tr>
        <td bgcolor="#3B4B8A" style="padding:28px 32px;border-radius:12px 12px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="58" valign="middle">
                <table width="52" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="52" height="52" align="center" valign="middle" bgcolor="#5264A8" style="border-radius:26px;font-size:14px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                      NHL
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle" style="padding-left:14px;">
                <p style="margin:0;font-size:17px;font-weight:700;color:#ffffff;">${CLINIC_NAME}</p>
                <p style="margin:4px 0 0 0;font-size:12px;color:rgba(255,255,255,0.65);">Secure Staff Login</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Accent bar -->
      <tr><td height="4" bgcolor="#F0A882"></td></tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 32px 28px 32px;">
          <p style="margin:0 0 14px 0;font-size:15px;color:#333333;">Hello${name ? ` ${name}` : ""},</p>
          <p style="margin:0 0 28px 0;font-size:14px;color:#555555;line-height:1.65;">
            Please use the verification code below to complete your sign-in to <strong>NHL Connect</strong>.
            This code is valid for <strong>10 minutes</strong> and can only be used once.
          </p>

          <!-- Code label -->
          <p style="margin:0 0 14px 0;font-size:11px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:1.5px;text-align:center;">
            Your one-time verification code
          </p>

          <!-- Digit boxes — table layout for all email clients -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="6" border="0">
                  <tr>
                    ${digits.map(d => `<td width="48" height="58" align="center" valign="middle" bgcolor="#EEF0F8" style="border:2px solid #3B4B8A;border-radius:8px;font-size:26px;font-weight:700;color:#3B4B8A;">${d}</td>`).join("\n                    ")}
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Large selectable code for easy copying -->
          <p style="margin:20px 0 6px 0;font-size:34px;font-weight:700;color:#3B4B8A;letter-spacing:10px;text-align:center;user-select:all;">${code}</p>
          <p style="margin:0 0 6px 0;font-size:11px;color:#bbbbbb;text-align:center;">Press and hold the code above to copy it</p>
          <p style="margin:0 0 28px 0;font-size:12px;color:#c0392b;text-align:center;font-weight:600;">Expires in 10 minutes</p>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td height="1" bgcolor="#eeeeee"></td></tr>
          </table>

          <p style="margin:24px 0 0 0;font-size:12px;color:#aaaaaa;line-height:1.75;">
            If you did not attempt to sign in, please ignore this email &mdash; your account remains secure.<br>
            Never share this code with anyone. ${CLINIC_NAME} staff will never ask for your verification code.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td bgcolor="#f8f9fc" style="padding:18px 32px;text-align:center;font-size:11px;color:#cccccc;border-top:1px solid #eeeeee;border-radius:0 0 12px 12px;">
          &copy; ${new Date().getFullYear()} ${CLINIC_NAME} &bull; Lusaka, Zambia<br>
          This is an automated security email for registered NHS Connect staff members.
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

    const textBody = `Hello ${name || ""},\n\nYour NHL Connect verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you did not request this, please ignore this email.\n\n${CLINIC_NAME}`;

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: args.email }] }],
          from: { email: fromEmail, name: CLINIC_NAME },
          reply_to: { email: fromEmail, name: CLINIC_NAME },
          subject: `${code} is your NHL Connect verification code`,
          content: [
            { type: "text/plain", value: textBody },
            { type: "text/html", value: htmlBody },
          ],
          categories: ["otp", "transactional", "authentication"],
          mail_settings: {
            bypass_list_management: { enable: true },
            bypass_spam_management: { enable: true },
          },
          tracking_settings: {
            click_tracking: { enable: false },
            open_tracking: { enable: false },
            subscription_tracking: { enable: false },
          },
        }),
      });

      if (response.status === 202 || response.status === 200) {
        console.log(`[NOTIFY] ✅ OTP email sent to ${args.email}`);
        return { success: true };
      } else {
        const body = await response.text();
        console.error(`[NOTIFY] ❌ SendGrid OTP error ${response.status}: ${body}`);
        return { success: false, error: `Failed to send code (${response.status}). Check SendGrid sender verification.` };
      }
    } catch (e: any) {
      console.error("[NOTIFY] OTP send error:", e);
      return { success: false, error: e.message };
    }
  },
});
