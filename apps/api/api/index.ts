let appInstance: any;
let initError: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../src/server');
  appInstance = mod.default || mod;
} catch (err: any) {
  initError = err;
  console.error('[Vercel Serverless Boot Error]:', err);
}

export default function handler(req: any, res: any) {
  if (initError) {
    console.error('[API Handler Error - Init Failed]:', initError);
    return res.status(500).json({
      status: 'error',
      code: 'SERVERLESS_INIT_FAILED',
      message: initError.message,
      stack: initError.stack,
      hint: 'An uncaught error occurred during server startup. Check Vercel environment variables and database connectivity.',
    });
  }

  return appInstance(req, res);
}
