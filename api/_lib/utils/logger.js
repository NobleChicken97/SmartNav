/**
 * Simple logger for Vercel Serverless (replaces Winston)
 */

const createLogger = () => ({
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, meta);
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, meta);
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, meta);
  },
  child: (meta) => createLogger() // Simplified child logger
});

const logger = createLogger();

export default logger;
