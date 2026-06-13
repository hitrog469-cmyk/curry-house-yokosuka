import nodemailer from 'nodemailer'

// Escape user-supplied values before interpolating into email HTML
function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export async function sendVerificationEmail(email: string, fullName: string, code: string) {
  const transporter = getTransporter()

  await transporter.sendMail({
    from: `"The Curry House Yokosuka" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `${code} is your verification code — The Curry House Yokosuka`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
          <div style="background: #16a34a; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">The Curry House Yokosuka</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #111; margin-top: 0;">Welcome, ${escapeHtml(fullName)}!</h2>
            <p style="color: #555; line-height: 1.6;">
              Thank you for signing up. Enter the verification code below to activate your account.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <div style="display: inline-block; background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; padding: 18px 32px;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #15803d; font-family: 'Courier New', monospace;">${escapeHtml(code)}</span>
              </div>
            </div>
            <p style="color: #888; font-size: 13px; text-align: center;">
              This code expires in <strong>15 minutes</strong>.<br/>
              If you didn't sign up, you can safely ignore this email.
            </p>
          </div>
          <div style="background: #f3f4f6; padding: 16px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              The Curry House Yokosuka · 〒238-0041 Kanagawa, Yokosuka
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.thecurryhouseyokosuka.com'
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`

  const transporter = getTransporter()

  await transporter.sendMail({
    from: `"The Curry House Yokosuka" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Reset your password — The Curry House Yokosuka',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
          <div style="background: #16a34a; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">The Curry House Yokosuka</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #111; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #555; line-height: 1.6;">
              We received a request to reset the password for your account.
              Click the button below to choose a new password.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}"
                style="background: #16a34a; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                Reset My Password
              </a>
            </div>
            <p style="color: #888; font-size: 13px; text-align: center;">
              This link expires in <strong>1 hour</strong>.<br/>
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          <div style="background: #f3f4f6; padding: 16px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              The Curry House Yokosuka · 〒238-0041 Kanagawa, Yokosuka
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
