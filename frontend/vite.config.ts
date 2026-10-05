import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import nodemailer from 'nodemailer';

function emailGatewayPlugin(): Plugin {
  const handler = async (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let bodyStr = '';
    req.on('data', (chunk: any) => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(bodyStr || '{}');
        const { to, subject, html, text, apiKey, from, smtpUser, smtpPass } = data;

        if (!to || !subject || (!html && !text)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing required email fields (to, subject, html/text)' }));
          return;
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

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              id: info.messageId,
              provider: 'gmail_smtp',
              deliveredTo: to,
              timestamp: new Date().toISOString(),
            }));
            return;
          } catch (smtpErr: any) {
            console.error('Gmail SMTP error, attempting fallback if configured:', smtpErr);
            if (!effectiveApiKey) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                reason: 'SMTP_ERROR',
                error: smtpErr?.message || 'Gmail SMTP dispatch failed',
                deliveredTo: to,
              }));
              return;
            }
          }
        }

        // 2. Secondary: Resend API
        if (effectiveApiKey) {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${effectiveApiKey.trim()}`,
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
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              reason: 'RESEND_ERROR',
              error: resendData,
              deliveredTo: to,
            }));
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            id: resendData.id,
            provider: 'resend',
            deliveredTo: to,
            timestamp: new Date().toISOString(),
          }));
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: false,
          reason: 'NO_GATEWAY',
          message: 'No SMTP or Resend credentials configured.',
          deliveredTo: to,
        }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err?.message || 'Email dispatch failed' }));
      }
    });
  };

  return {
    name: 'email-gateway-plugin',
    configureServer(server) {
      server.middlewares.use('/api/send-email', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/send-email', handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), emailGatewayPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3001,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['@reduxjs/toolkit', 'react-redux', '@tanstack/react-query'],
          'vendor-ui': ['lucide-react', 'framer-motion'],
        },
      },
    },
  },
});

