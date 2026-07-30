export const aiLogger = {
  logs: [] as string[],
  isRunning: false,
  log: (msg: string) => {
    console.log(msg);
    aiLogger.logs.push(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ${msg}`);
  },
  clear: () => {
    aiLogger.logs = [];
  }
};
