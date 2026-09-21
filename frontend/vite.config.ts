import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function emailGatewayPlugin(): Plugin {
  return {
    name: 'email-gateway-plugin',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let bodyStr = '';
        req.on('data', (chunk) => { bodyStr += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(bodyStr || '{}');
            const { to, subject, html, text, apiKey, from } = data;

            if (!to || !subject || (!html && !text)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing required email fields (to, subject, html/text)' }));
              return;
            }

            const effectiveApiKey = apiKey || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

            if (!effectiveApiKey) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                reason: 'NO_API_KEY',
                message: 'Outbound email dispatch requires a Resend API key or Gmail SMTP configuration. Configure in Admin Email Gateway console or use the direct Gmail Web compose bridge.',
                deliveredTo: to,
              }));
              return;
            }

            // Call Resend API via Node native fetch to deliver to real Gmail inboxes
            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${effectiveApiKey.trim()}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: from || 'M-TRAVEL Concierge <onboarding@resend.dev>',
                to: [to],
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
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Email dispatch failed' }));
          }
        });
      });
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
});

