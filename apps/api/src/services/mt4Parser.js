"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTrades = parseTrades;
const node_html_parser_1 = require("node-html-parser");
const fs_1 = require("fs");
// Detect file type
function detectFormat(fileBuffer) {
    const fileContent = fileBuffer.toString('utf-8', 0, 1024); // First 1KB
    if (fileContent.includes('<table'))
        return 'MT4_HTM';
    if (fileContent.includes('Ticket,Time,Type,Size,Item,Price,S/L,T/P,Close Time,Close Price,Commission,Swap,Profit')) {
        return 'MT4_CSV';
    }
    if (fileContent.includes('Position,Symbol,Action,Volume,Open Time,Open Price,S/L,T/P,Close Time,Close Price,Commission,Swap,Profit,Comment')) {
        return 'MT5_CSV';
    }
    throw new Error('Unsupported file format');
}
// Parse MT4 HTML
async function parseMT4HTML(fileBuffer) {
    const html = (0, node_html_parser_1.parse)(fileBuffer.toString('utf-8'));
    const table = html.querySelector('table');
    if (!table)
        throw new Error('No table found in MT4 HTML');
    return Array.from(table.querySelectorAll('tr')).slice(1).map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length < 11)
            return null;
        return {
            symbol: cells[4].textContent?.trim() || '',
            direction: cells[2].textContent?.trim(),
            openTime: cells[1].textContent?.trim() || '',
            openPrice: parseFloat(cells[5].textContent?.trim() || '0'),
            closeTime: cells[8].textContent?.trim() || '',
            closePrice: parseFloat(cells[9].textContent?.trim() || '0'),
            lotSize: parseFloat(cells[3].textContent?.trim() || '0'),
            stopLoss: parseFloat(cells[6].textContent?.trim() || '0'),
            takeProfit: parseFloat(cells[7].textContent?.trim() || '0'),
            profitUsd: parseFloat(cells[11].textContent?.trim().replace(/\,/g, '')) || 0,
            commission: parseFloat(cells[10].textContent?.trim() || '0'),
            swap: parseFloat(cells[11].textContent?.trim() || '0'),
            rMultiple: 0,
            importSource: 'MT4_HTM'
        };
    }).filter(Boolean);
}
// Parse MT4 CSV
function parseMT4CSV(csvData) {
    const lines = csvData.split('\n');
    return lines.slice(1).map(line => {
        const [ticket, time, type, size, symbol, price, sl, tp, closeTime, closePrice, commission, swap, profit] = line.split('\t');
        return {
            ticket: parseInt(ticket?.trim() || '0'),
            symbol: symbol?.trim() || '',
            direction: type?.trim() || 'BUY',
            openTime: time?.trim() || '',
            openPrice: parseFloat(price?.trim() || '0'),
            closeTime: closeTime?.trim() || '',
            closePrice: parseFloat(closePrice?.trim() || '0'),
            lotSize: parseFloat(size?.trim() || '0'),
            stopLoss: parseFloat(sl?.trim() || '0'),
            takeProfit: parseFloat(tp?.trim() || '0'),
            profitUsd: parseFloat(profit?.trim().replace(/\,/g, '')) || 0,
            commission: parseFloat(commission?.trim() || '0'),
            swap: parseFloat(swap?.trim() || '0'),
            rMultiple: 0,
            importSource: 'MT4_CSV'
        };
    }).filter(trade => trade.symbol && trade.direction);
}
// Parse MT5 CSV
function parseMT5CSV(csvData) {
    const lines = csvData.split('\n');
    return lines.slice(1).map(line => {
        const [position, symbol, action, volume, openTime, openPrice, sl, tp, closeTime, closePrice, commission, swap, profit] = line.split(',');
        return {
            ticket: parseInt(position?.trim() || '0'),
            symbol: symbol?.trim() || '',
            direction: action?.trim() || 'BUY',
            openTime: openTime?.trim() || '',
            openPrice: parseFloat(openPrice?.trim() || '0'),
            closeTime: closeTime?.trim() || '',
            closePrice: parseFloat(closePrice?.trim() || '0'),
            lotSize: parseFloat(volume?.trim() || '0'),
            stopLoss: parseFloat(sl?.trim() || '0'),
            takeProfit: parseFloat(tp?.trim() || '0'),
            profitUsd: parseFloat(profit?.trim().replace(/\,/g, '')) || 0,
            commission: parseFloat(commission?.trim() || '0'),
            swap: parseFloat(swap?.trim() || '0'),
            rMultiple: 0,
            importSource: 'MT5_CSV'
        };
    }).filter(trade => trade.symbol && trade.direction);
}
// Main parse function
async function parseTrades(file) {
    const fileBuffer = await fs_1.promises.readFile(file.path);
    const format = detectFormat(fileBuffer);
    let parsedTrades;
    switch (format) {
        case 'MT4_HTM':
            parsedTrades = await parseMT4HTML(fileBuffer);
            break;
        case 'MT4_CSV':
            parsedTrades = parseMT4CSV(fileBuffer.toString('utf-8'));
            break;
        case 'MT5_CSV':
            parsedTrades = parseMT5CSV(fileBuffer.toString('utf-8'));
            break;
        default:
            throw new Error('Unsupported file format');
    }
    // Validate and calculate derived fields
    return parsedTrades.map(trade => {
        // Calculate pips
        const entryPrice = trade.openPrice;
        const exitPrice = trade.closePrice || 0;
        let pips = 0;
        if (trade.direction === 'BUY') {
            pips = (exitPrice - entryPrice) * 1000; // Assuming 5-digit pips
        }
        else {
            pips = (entryPrice - exitPrice) * 1000;
        }
        // Calculate R multiple
        const entryRisk = Math.abs(trade.openPrice - (trade.stopLoss ?? 0));
        const profit = trade.profitUsd - trade.commission - trade.swap;
        const rMultiple = entryRisk > 0 ? (profit / entryRisk) : 0;
        return {
            ...trade,
            pips,
            rMultiple
        };
    });
}
