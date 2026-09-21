var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
var __dirname = path.dirname(fileURLToPath(import.meta.url));
function emailGatewayPlugin() {
    return {
        name: 'email-gateway-plugin',
        configureServer: function (server) {
            var _this = this;
            server.middlewares.use('/api/send-email', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var bodyStr;
                var _this = this;
                return __generator(this, function (_a) {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ error: 'Method not allowed' }));
                        return [2 /*return*/];
                    }
                    bodyStr = '';
                    req.on('data', function (chunk) { bodyStr += chunk; });
                    req.on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                        var data, to, subject, html, text, apiKey, from, effectiveApiKey, resendRes, resendData, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    data = JSON.parse(bodyStr || '{}');
                                    to = data.to, subject = data.subject, html = data.html, text = data.text, apiKey = data.apiKey, from = data.from;
                                    if (!to || !subject || (!html && !text)) {
                                        res.statusCode = 400;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.end(JSON.stringify({ error: 'Missing required email fields (to, subject, html/text)' }));
                                        return [2 /*return*/];
                                    }
                                    effectiveApiKey = apiKey || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
                                    if (!effectiveApiKey) {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.end(JSON.stringify({
                                            success: false,
                                            reason: 'NO_API_KEY',
                                            message: 'Outbound email dispatch requires a Resend API key or Gmail SMTP configuration. Configure in Admin Email Gateway console or use the direct Gmail Web compose bridge.',
                                            deliveredTo: to,
                                        }));
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, fetch('https://api.resend.com/emails', {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': "Bearer ".concat(effectiveApiKey.trim()),
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                                from: from || 'M-TRAVEL Concierge <onboarding@resend.dev>',
                                                to: [to],
                                                subject: subject,
                                                html: html,
                                                text: text,
                                            }),
                                        })];
                                case 1:
                                    resendRes = _a.sent();
                                    return [4 /*yield*/, resendRes.json()];
                                case 2:
                                    resendData = _a.sent();
                                    if (!resendRes.ok) {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.end(JSON.stringify({
                                            success: false,
                                            reason: 'RESEND_ERROR',
                                            error: resendData,
                                            deliveredTo: to,
                                        }));
                                        return [2 /*return*/];
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
                                    return [3 /*break*/, 4];
                                case 3:
                                    err_1 = _a.sent();
                                    res.statusCode = 500;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.end(JSON.stringify({ error: (err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || 'Email dispatch failed' }));
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
                });
            }); });
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
