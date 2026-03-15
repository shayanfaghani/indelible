import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CONTACT_CONFIG, REQUEST_TYPES } from "@/lib/config/contact";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { requestType, message, name, phone } = await request.json();

        if (!requestType || !message?.trim()) {
            return NextResponse.json({ error: "Request type and message are required" }, { status: 400 });
        }

        if (message.length > CONTACT_CONFIG.MAX_MESSAGE_CHARS) {
            return NextResponse.json({ error: "Message exceeds maximum length" }, { status: 400 });
        }

        const requestLabel = REQUEST_TYPES.find((r) => r.value === requestType)?.label ?? requestType;

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Indelible – ${requestLabel}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0A0A0B;padding:28px 36px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#E5C05E;letter-spacing:-0.5px;">Indelible</span>
            </td>
          </tr>

          <!-- Tag row -->
          <tr>
            <td style="padding:28px 36px 0;">
              <span style="display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;color:#6b7280;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${requestLabel}</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 36px 28px;">
              <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#111827;">User Message</h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#374151;background:#f9fafb;border-left:3px solid #E5C05E;padding:14px 16px;border-radius:0 6px 6px 0;">${message.replace(/\n/g, "<br/>")}</p>

              <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Sender Details</h3>
              <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 16px;font-size:13px;color:#6b7280;width:110px;font-weight:600;">Name</td>
                  <td style="padding:10px 16px;font-size:13px;color:#111827;">${name || "—"}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;font-weight:600;">Email</td>
                  <td style="padding:10px 16px;font-size:13px;color:#111827;border-top:1px solid #e5e7eb;">${user.email}</td>
                </tr>
                ${phone ? `
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 16px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;font-weight:600;">Phone</td>
                  <td style="padding:10px 16px;font-size:13px;color:#111827;border-top:1px solid #e5e7eb;">${phone}</td>
                </tr>` : ""}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Sent from Indelible · <a href="https://indelible.app" style="color:#9ca3af;">indelible.app</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const { error } = await resend.emails.send({
            from: CONTACT_CONFIG.FROM_EMAIL,
            to: CONTACT_CONFIG.RECIPIENT_EMAIL,
            subject: `[Indelible] ${requestLabel} from ${name || user.email}`,
            html,
        });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
