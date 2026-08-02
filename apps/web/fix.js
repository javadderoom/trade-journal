const fs = require('fs');
let code = fs.readFileSync('src/store/useTradeStore.ts', 'utf8');

// Fix MOCK_TRADES
code = code.replace(,    tags: (\[.*?\]]),\s*emotion: ('.*?'),\s*notes: ('.*?'),/g, `    annotation: {
      tags: $1,
      emotion: $2,
      notes: $3,
      screenshots: [],
      analysisTimeframe: null,
      entryTimeframe: null
    },`);

// Fix fetchTrades mapper
code = code.replace(/tags: item\.annotation\?\.tags \?\? \\[\\],[\\s\\S];*?entryTimeframe: item\.annotation\?\.entryTimeframe \?\? null,/g, `annotation: item.annotation ? {
              tags: item.annotation.tags ?? [],
              emotion: item.annotation.emotion ?? null,
              notes: item.annotation.notes ?? null,
              screenshots: item.annotation.screenshots ?? [],
              analysisTimeframe: item.annotation.analysisTimeframe ?? null,
              entryTimeframe: item.annotation.entryTimeframe ?? null,
            } : null,
            chartData: item.chartData ?? null,`);

fs.writeFileSync('src/store/useTradeStore.ts', code);