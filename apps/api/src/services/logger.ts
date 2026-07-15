import { prisma } from './tradeSync';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Write a log entry to the SystemLog table.
 * Fire-and-forget: errors are caught and logged to console, never thrown.
 */
export async function logSystem(entry: LogEntry): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        level: entry.level,
        source: entry.source,
        message: entry.message,
        details: entry.details ?? undefined,
      },
    });
  } catch (err: any) {
    console.error(`[Logger] Failed to write log: ${err.message}`);
  }
}

export async function logInfo(source: string, message: string, details?: Record<string, any>) {
  return logSystem({ level: 'INFO', source, message, details });
}

export async function logWarn(source: string, message: string, details?: Record<string, any>) {
  return logSystem({ level: 'WARN', source, message, details });
}

export async function logError(source: string, message: string, details?: Record<string, any>) {
  return logSystem({ level: 'ERROR', source, message, details });
}

export async function logFatal(source: string, message: string, details?: Record<string, any>) {
  return logSystem({ level: 'FATAL', source, message, details });
}
