"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const tradeSync_1 = __importDefault(require("./routes/tradeSync"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json({ limit: '10mb' }));
// CORS — allow MT5 EA and web app
app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (_req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    next();
});
// Routes
app.use('/api/trades', tradeSync_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Start server
app.listen(PORT, () => {
    console.log(`معامله‌یار API running on http://localhost:${PORT}`);
    console.log(`Trade sync endpoint: POST http://localhost:${PORT}/api/trades/sync`);
});
exports.default = app;
