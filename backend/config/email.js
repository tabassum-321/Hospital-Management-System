const nodemailer = require('nodemailer');

// ── Create transporter ───────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Templates ────────────────────────────────────────────────
const appointmentConfirmHTML = (data) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'DM Sans', Arial, sans-serif; margin:0; padding:0; background:#f4f8ff; }
    .wrapper { max-width:580px; margin:2rem auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(21,101,192,.1); }
    .header { background:linear-gradient(135deg,#1565c0,#00acc1); padding:2rem; text-align:center; color:white; }
    .header h1 { margin:0; font-size:1.5rem; }
    .header p  { margin:.5rem 0 0; opacity:.85; font-size:.9rem; }
    .logo { font-size:2rem; margin-bottom:.5rem; }
    .body { padding:2rem; }
    .detail-row { display:flex; padding:.75rem 0; border-bottom:1px solid #e2ecf8; }
    .detail-row:last-child { border:none; }
    .detail-label { width:140px; font-weight:600; color:#7a7a9a; font-size:.88rem; }
    .detail-value { flex:1; color:#1a1a2e; font-size:.88rem; }
    .badge { display:inline-block; background:#e8f5e9; color:#2e7d32; padding:.3rem .9rem; border-radius:20px; font-weight:600; font-size:.82rem; }
    .cta { text-align:center; margin:2rem 0 1rem; }
    .btn { display:inline-block; background:linear-gradient(135deg,#1565c0,#00acc1); color:white !important; padding:.8rem 2rem; border-radius:30px; text-decoration:none; font-weight:700; font-size:.9rem; }
    .footer { background:#f4f8ff; padding:1.25rem 2rem; text-align:center; font-size:.78rem; color:#7a7a9a; }
    .emergency { background:#fce8e8; border-left:4px solid #c62828; padding:1rem; border-radius:8px; margin-top:1.5rem; font-size:.85rem; color:#c62828; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">🏥</div>
    <h1>Appointment Confirmed!</h1>
    <p>MediCare Hospital — Patient Notification</p>
  </div>
  <div class="body">
    <p>Dear <strong>${data.patientName}</strong>,</p>
    <p>Your appointment request has been received. Here are your details:</p>
    <div style="background:#f4f8ff;border-radius:12px;padding:1.25rem;margin:1.5rem 0;">
      <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">${data.doctor}</span></div>
      <div class="detail-row"><span class="detail-label">Department</span><span class="detail-value">${data.department}</span></div>
      <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${data.date}</span></div>
      <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${data.time}</span></div>
      <div class="detail-row"><span class="detail-label">Reason</span><span class="detail-value">${data.reason || 'General consultation'}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge">Pending Confirmation</span></span></div>
    </div>
    <p style="color:#4a4a6a;font-size:.9rem;">Please arrive <strong>10 minutes early</strong> and bring any previous medical records or prescriptions.</p>
    <div class="cta">
      <a href="http://localhost:5000/frontend/pages/patient-dashboard.html" class="btn">View My Dashboard</a>
    </div>
    <div class="emergency">
      <strong>Emergency?</strong> Call us immediately at <strong>+1 (800) 123-4567</strong> — available 24/7.
    </div>
  </div>
  <div class="footer">
    © 2026 MediCare Hospital · 123 Medical Drive, Health City, NY 10001<br/>
    <a href="#" style="color:#1565c0;">Unsubscribe</a> · <a href="#" style="color:#1565c0;">Privacy Policy</a>
  </div>
</div>
</body>
</html>`;

// ── Exported functions ────────────────────────────────────────

/**
 * Send appointment confirmation email to patient
 */
async function sendAppointmentConfirmation(appointment) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Email not configured — skipping email send');
    return;
  }
  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || '"MediCare Hospital" <noreply@medicare.com>',
      to:      appointment.email,
      subject: `✅ Appointment Booked — ${appointment.date} at ${appointment.time}`,
      html:    appointmentConfirmHTML(appointment),
    });
    console.log(`📧 Confirmation email sent to ${appointment.email}`);
  } catch (err) {
    console.error('📧 Email send failed:', err.message);
  }
}

/**
 * Send appointment status update email (confirmed / cancelled)
 */
async function sendStatusUpdate(appointment, newStatus) {
  if (!process.env.EMAIL_USER || !appointment.email) return;
  const subject = newStatus === 'confirmed'
    ? `✅ Appointment Confirmed — ${appointment.date} at ${appointment.time}`
    : `❌ Appointment Cancelled — ${appointment.date}`;
  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to:      appointment.email,
      subject,
      html: `<p>Dear ${appointment.patientName},</p><p>Your appointment status has been updated to: <strong>${newStatus.toUpperCase()}</strong>.</p>
             <p>Doctor: ${appointment.doctor}<br/>Date: ${appointment.date}<br/>Time: ${appointment.time}</p>
             <p>For assistance call: +1 (800) 123-4567</p>`,
    });
  } catch (err) {
    console.error('📧 Status email failed:', err.message);
  }
}

module.exports = { sendAppointmentConfirmation, sendStatusUpdate };