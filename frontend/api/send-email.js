import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { to, subject, html, text, apiKey, from, smtpUser, smtpPass } = data;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ error: 'Missing required email fields (to, subject, html/text)' });
    }

    const effectiveSmtpUser = smtpUser || process.env.SMTP_USER || 'jamalkarisa96@gmail.com';
    const rawPass = smtpPass || process.env.SMTP_PASS || 'shrlkouyuajvddsa';
    const effectiveSmtpPass = (rawPass || '').replace(/\s+/g, '');
    const effectiveApiKey = apiKey || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

    // 1. Primary: Direct Gmail SMTP using Google App Password
    if (effectiveSmtpUser && effectiveSmtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: effectiveSmtpUser,
            pass: effectiveSmtpPass,
          },
        });

        const senderAddress = from || `"M-TRAVEL Concierge" <${effectiveSmtpUser}>`;
        const info = await transporter.sendMail({
          from: senderAddress,
          to: Array.isArray(to) ? to.join(', ') : to,
          subject,
          html: html || text,
          text: text || undefined,
        });

        return res.status(200).json({
          success: true,
          id: info.messageId,
          provider: 'gmail_smtp',
          deliveredTo: to,
          timestamp: new Date().toISOString(),
        });
      } catch (smtpErr) {
        console.error('Gmail SMTP error, attempting fallback if configured:', smtpErr);
        if (!effectiveApiKey) {
          return res.status(200).json({
            success: false,
            reason: 'SMTP_ERROR',
            error: smtpErr?.message || 'Gmail SMTP dispatch failed',
            deliveredTo: to,
          });
        }
      }
    }

    // 2. Secondary: Resend API
    if (effectiveApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${effectiveApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from || 'M-TRAVEL Concierge <onboarding@resend.dev>',
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        return res.status(200).json({
          success: false,
          reason: 'RESEND_ERROR',
          error: resendData,
          deliveredTo: to,
        });
      }

      return res.status(200).json({
        success: true,
        id: resendData.id,
        provider: 'resend',
        deliveredTo: to,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: false,
      reason: 'NO_GATEWAY_CREDENTIALS',
      message: 'No SMTP or Resend credentials configured.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      reason: 'NETWORK_ERROR',
      error: err?.message || 'Internal error in email gateway',
    });
  }
}
