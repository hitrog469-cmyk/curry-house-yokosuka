import nodemailer from 'nodemailer'

// ─── Transporter ────────────────────────────────────────────────────────────
function getTransporter() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    console.warn('[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — emails disabled')
    return null
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

// Admin emails to notify — comma-separated in env var
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_NOTIFY_EMAILS || ''
  return raw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

// ─── Core send helper ────────────────────────────────────────────────────────
async function sendEmail(opts: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
  attachments?: { filename: string; path: string }[]
}) {
  const transporter = getTransporter()
  if (!transporter) return { success: false, error: 'Email not configured' }

  const from = `The Curry House Yokosuka <${process.env.GMAIL_USER}>`
  const toList = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to

  try {
    await transporter.sendMail({
      from,
      to: toList,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
      attachments: opts.attachments,
    })
    return { success: true }
  } catch (err: any) {
    console.error('[email] Send failed:', err.message)
    return { success: false, error: err.message }
  }
}

// ─── Shared email wrapper ────────────────────────────────────────────────────
const header = `
<div style="background:#1a1a1a;padding:20px 30px;border-radius:12px 12px 0 0;">
  <h1 style="color:#f97316;margin:0;font-size:22px;font-weight:900;font-family:sans-serif;">
    The Curry House Yokosuka
  </h1>
</div>`

const footer = `
<div style="background:#f1f5f9;padding:16px 30px;border-radius:0 0 12px 12px;text-align:center;">
  <p style="margin:0;color:#64748b;font-size:12px;font-family:sans-serif;">
    2-8-9 Honcho, Yokosuka City, Kanagawa 238-0041 &nbsp;|&nbsp; 046-813-5869 &nbsp;|&nbsp;
    <a href="mailto:thecurryhouseyokosuka@gmail.com" style="color:#f97316;">thecurryhouseyokosuka@gmail.com</a>
  </p>
</div>`

function wrap(body: string) {
  return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
  ${header}
  <div style="padding:24px 30px;background:#fff;">
    ${body}
  </div>
  ${footer}
</div>`
}

function row(label: string, value: string) {
  return `
<tr>
  <td style="padding:8px 12px;background:#f8fafc;color:#64748b;font-weight:700;font-size:13px;white-space:nowrap;border-radius:6px 0 0 6px;">${label}</td>
  <td style="padding:8px 12px;color:#1e293b;font-size:14px;border-radius:0 6px 6px 0;">${value || '—'}</td>
</tr>`
}

function table(rows: string) {
  return `<table cellpadding="0" cellspacing="4" style="width:100%;border-collapse:separate;border-spacing:0 4px;">${rows}</table>`
}

// ─── 1. Contact form ─────────────────────────────────────────────────────────
export async function sendContactEmail(data: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}) {
  const adminEmails = getAdminEmails()
  const subjectLabels: Record<string, string> = {
    general: 'General Inquiry', reservation: 'Reservation',
    order: 'Order Question', feedback: 'Feedback',
    catering: 'Catering Request', careers: 'Careers', other: 'Other'
  }

  // Email to admins
  if (adminEmails.length > 0) {
    await sendEmail({
      to: adminEmails,
      subject: `New Contact: ${subjectLabels[data.subject] || data.subject} — ${data.name}`,
      replyTo: data.email,
      html: wrap(`
        <h2 style="color:#1e293b;margin:0 0 4px;">New Contact Form Submission</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px;">Submitted just now from the website</p>
        ${table(
          row('Name', data.name) +
          row('Email', `<a href="mailto:${data.email}" style="color:#f97316;">${data.email}</a>`) +
          row('Phone', data.phone || '—') +
          row('Subject', subjectLabels[data.subject] || data.subject)
        )}
        <div style="margin-top:16px;padding:16px;background:#f8fafc;border-left:4px solid #f97316;border-radius:0 8px 8px 0;">
          <p style="font-weight:700;color:#475569;font-size:12px;margin:0 0 8px;text-transform:uppercase;">Message</p>
          <p style="color:#1e293b;font-size:14px;margin:0;white-space:pre-line;">${data.message}</p>
        </div>
        <p style="margin-top:16px;font-size:13px;color:#64748b;">
          Reply directly to this email to respond to ${data.name}.
        </p>
      `),
    })
  }

  // Auto-reply to customer
  await sendEmail({
    to: data.email,
    subject: `We received your message — The Curry House Yokosuka`,
    html: wrap(`
      <h2 style="color:#1e293b;margin:0 0 4px;">Thanks, ${data.name}! We got your message.</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px;">
        We typically reply within a few hours. Here's a copy of what you sent:
      </p>
      ${table(
        row('Subject', subjectLabels[data.subject] || data.subject) +
        row('Message', `<span style="white-space:pre-line;">${data.message}</span>`)
      )}
      <p style="margin-top:20px;font-size:14px;color:#475569;">
        In the meantime, you can also reach us at:<br>
        <strong>046-813-5869</strong> &nbsp;|&nbsp; <strong>046-828-6716</strong>
      </p>
    `),
  })
}

// ─── 2. Catering inquiry ─────────────────────────────────────────────────────
export async function sendCateringEmail(data: {
  name: string
  email: string
  phone: string
  event_type: string
  guest_count: number
  event_date: string
  event_time: string
  special_requirements?: string
}) {
  const adminEmails = getAdminEmails()

  if (adminEmails.length > 0) {
    await sendEmail({
      to: adminEmails,
      subject: `New Catering Inquiry — ${data.name} (${data.event_type}, ${data.guest_count} guests)`,
      replyTo: data.email,
      html: wrap(`
        <h2 style="color:#1e293b;margin:0 0 4px;">New Catering Inquiry</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px;">A customer wants to book catering for an event</p>
        ${table(
          row('Name', data.name) +
          row('Email', `<a href="mailto:${data.email}" style="color:#f97316;">${data.email}</a>`) +
          row('Phone', `<a href="tel:${data.phone}" style="color:#f97316;">${data.phone}</a>`) +
          row('Event Type', data.event_type) +
          row('Guest Count', `${data.guest_count} people`) +
          row('Event Date', new Date(data.event_date).toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })) +
          row('Event Time', data.event_time) +
          (data.special_requirements ? row('Special Requirements', data.special_requirements) : '')
        )}
        <div style="margin-top:16px;padding:12px 16px;background:#fef3c7;border-radius:8px;border:1px solid #fcd34d;">
          <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">
            Status: Pending — please reply to confirm and discuss details
          </p>
        </div>
      `),
    })
  }

  // Auto-reply to customer
  await sendEmail({
    to: data.email,
    subject: `Catering inquiry received — The Curry House Yokosuka`,
    html: wrap(`
      <h2 style="color:#1e293b;margin:0 0 4px;">Thanks, ${data.name}! Your catering inquiry is received.</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px;">
        We'll review the details and get back to you within 24 hours to discuss and confirm.
      </p>
      ${table(
        row('Event Type', data.event_type) +
        row('Guest Count', `${data.guest_count} people`) +
        row('Date', new Date(data.event_date).toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })) +
        row('Time', data.event_time) +
        (data.special_requirements ? row('Special Requirements', data.special_requirements) : '')
      )}
      <p style="margin-top:20px;font-size:14px;color:#475569;">
        Questions? Call us: <strong>046-813-5869</strong>
      </p>
    `),
  })
}

// ─── 3. Career application ───────────────────────────────────────────────────
export async function sendCareerEmail(data: {
  name: string
  email: string
  phone: string
  position: string
  cover_letter: string
  cv_url?: string
}) {
  const adminEmails = getAdminEmails()

  if (adminEmails.length > 0) {
    await sendEmail({
      to: adminEmails,
      subject: `New Job Application — ${data.name} for ${data.position}`,
      replyTo: data.email,
      html: wrap(`
        <h2 style="color:#1e293b;margin:0 0 4px;">New Job Application</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px;">A candidate has applied for a position</p>
        ${table(
          row('Name', data.name) +
          row('Email', `<a href="mailto:${data.email}" style="color:#f97316;">${data.email}</a>`) +
          row('Phone', `<a href="tel:${data.phone}" style="color:#f97316;">${data.phone}</a>`) +
          row('Position', `<strong>${data.position}</strong>`) +
          (data.cv_url ? row('CV / Resume', `<a href="${data.cv_url}" style="color:#f97316;font-weight:700;">Download CV</a>`) : row('CV', 'Not submitted'))
        )}
        <div style="margin-top:16px;padding:16px;background:#f8fafc;border-left:4px solid #8b5cf6;border-radius:0 8px 8px 0;">
          <p style="font-weight:700;color:#475569;font-size:12px;margin:0 0 8px;text-transform:uppercase;">Cover Letter</p>
          <p style="color:#1e293b;font-size:14px;margin:0;white-space:pre-line;">${data.cover_letter}</p>
        </div>
      `),
    })
  }

  // Auto-reply to applicant
  await sendEmail({
    to: data.email,
    subject: `Application received — The Curry House Yokosuka`,
    html: wrap(`
      <h2 style="color:#1e293b;margin:0 0 4px;">Thanks for applying, ${data.name}!</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px;">
        We've received your application for <strong>${data.position}</strong> and will review it within 48 hours.
        If your profile is a good fit, we'll be in touch to schedule an interview.
      </p>
      ${table(
        row('Position', data.position) +
        row('Application Status', '<span style="color:#16a34a;font-weight:700;">Received & Under Review</span>')
      )}
      <p style="margin-top:20px;font-size:14px;color:#475569;">
        Questions? Email us at <a href="mailto:thecurryhouseyokosuka@gmail.com" style="color:#f97316;">thecurryhouseyokosuka@gmail.com</a>
      </p>
    `),
  })
}
