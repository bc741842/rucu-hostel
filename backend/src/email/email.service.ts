import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
 
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
 
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      // Fail fast instead of hanging for minutes when the host blocks SMTP.
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
 
  /**
   * Sends an email. Never throws — a failed email should never break the
   * request that triggered it (booking, maintenance update, etc.). Errors
   * are logged instead so the rest of the app keeps working.
   *
   * If no `html` is given, the plain-text `text` is automatically wrapped in
   * the university letterhead template below, so every call site gets a
   * consistently branded email without having to build HTML itself.
   */
  async sendMail(to: string, subject: string, text: string, html?: string) {
    if (!to) return;
 
    // Preferred path: Brevo's HTTPS API. Many hosts (including Railway's
    // free/trial plans) block outbound SMTP, but HTTPS always works.
    if (process.env.BREVO_API_KEY) {
      const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify({
            sender: { name: 'RUCU Hostel Booking', email: senderEmail },
            to: [{ email: to }],
            subject,
            textContent: text,
            htmlContent: html ?? this.buildLetterheadHtml(subject, text),
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          this.logger.error(
            `Brevo rejected email to ${to}: ${res.status} ${await res.text()}`,
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to send email to ${to}: ${message}`);
      }
      return;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      this.logger.warn(
        'EMAIL_USER / EMAIL_PASS not set in .env — skipping email send.',
      );
      return;
    }
 
    try {
      await this.transporter.sendMail({
        from: `"RUCU Hostel Booking" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html: html ?? this.buildLetterheadHtml(subject, text),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email to ${to}: ${message}`);
    }
  }
 
  /**
   * Wraps a plain-text message in a formal, university-letter-style HTML
   * email: a dark header bar with the university/system name, a white
   * letter body, and a signature block — matching the look of RUCU's other
   * official correspondence (e.g. the Field Attachment letters).
   */
  private buildLetterheadHtml(subject: string, text: string): string {
    // Turn "text" into HTML paragraphs: blank line = new paragraph,
    // single newline = line break within a paragraph.
    const bodyHtml = text
      .split(/\n\s*\n/)
      .map(
        (para) =>
          `<p style="margin:0 0 16px 0;">${this.escapeHtml(para).replace(/\n/g, '<br/>')}</p>`,
      )
      .join('');
 
    return `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f1ea; font-family: Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ea; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e3ddcc;">
            <tr>
              <td style="background-color:#0a1f44; padding:24px 28px;">
                <div style="color:#ffffff; font-size:16px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase;">
                  Ruaha Catholic University
                </div>
                <div style="color:#d4af37; font-size:13px; margin-top:4px;">
                  RUCU Hostel Booking System
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <div style="color:#1a1a1a; font-size:14px; font-weight:bold; margin-bottom:16px;">
                  ${this.escapeHtml(subject)}
                </div>
                <div style="color:#2a2a2a; font-size:14px; line-height:1.6;">
                  ${bodyHtml}
                </div>
                <div style="margin-top:24px; color:#2a2a2a; font-size:14px; line-height:1.6;">
                  Regards,<br/>
                  <strong>RUCU Hostel Booking System</strong><br/>
                  Ruaha Catholic University
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f4f1ea; padding:14px 28px; border-top:1px solid #e3ddcc;">
                <div style="color:#8a8475; font-size:11px;">
                  This is an automated message from the RUCU Hostel Booking System. Please do not reply directly to this email.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }
 
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
 