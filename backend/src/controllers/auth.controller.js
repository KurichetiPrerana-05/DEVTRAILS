const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// In-memory OTP store: { phone -> { otp, expiresAt, attempts } }
// In production, replace with Redis (config/redis.js is already wired)
const otpStore = new Map();

// ── Helpers ────────────────────────────────────────────────────
function generateOTP() {
  return String(crypto.randomInt(100000, 999999)); // 6-digit cryptographically random
}

async function sendOTPViaSMS(phone, otp) {
  const provider = process.env.SMS_PROVIDER || 'console';

  if (provider === 'msg91' && process.env.MSG91_AUTH_KEY) {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: process.env.MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: phone.replace(/\D/g, ''),
        authkey: process.env.MSG91_AUTH_KEY,
        otp,
      }),
    });
    if (!res.ok) throw new Error('MSG91 send failed: ' + (await res.text()));
    return;
  }

  if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID) {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Your GigShield OTP is ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return;
  }

  // Fallback: log to console (dev/demo mode only - set SMS_PROVIDER in .env for production)
  console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
}

// ── Route handlers ─────────────────────────────────────────────

exports.sendOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(phone, { otp, expiresAt, attempts: 0 });

  try {
    await sendOTPViaSMS(phone, otp);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('[OTP] Send failed:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. Try again.' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  const record = otpStore.get(phone);

  if (!record) {
    return res.status(400).json({ error: 'No OTP found for this number. Request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP expired. Request a new one.' });
  }

  if (record.attempts >= 5) {
    otpStore.delete(phone);
    return res.status(429).json({ error: 'Too many attempts. Request a new OTP.' });
  }

  if (record.otp !== String(otp)) {
    record.attempts += 1;
    return res.status(400).json({ error: 'Invalid OTP', attemptsLeft: 5 - record.attempts });
  }

  // OTP valid — clear it (single-use)
  otpStore.delete(phone);

  const token = jwt.sign({ phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token });
};

// Legacy login kept for backwards compat
exports.login = async (req, res) => {
  const { phone } = req.body;
  const token = jwt.sign({ phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
};
