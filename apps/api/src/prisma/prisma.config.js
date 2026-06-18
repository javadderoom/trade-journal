"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("prisma/config");
const dotenv_1 = require("dotenv");
// Load .env from project root (4 levels up from apps/api/src/prisma/)
const envPath = node_path_1.default.resolve(__dirname, '..', '..', '.env');
(0, dotenv_1.config)({ path: envPath });
exports.default = (0, config_1.defineConfig)({
    schema: node_path_1.default.join(__dirname, 'schema.prisma'),
    datasource: {
        url: process.env.DATABASE_URL,
    },
});
