import { createLogger, format, Logger, transports } from 'winston';

const { combine, timestamp, label, printf } = format;
const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level}]: ${message} (${label})`;
});

const CONSOLE = 1;
const FILE = 2;
const CLOUD = 4;
const loggers: Record<string, Logger> = {};

export const getLogger = (name: string, option?: {
  level?: string;
  target?: string; // console|file|cloud
}) => {
  if (loggers[name]) {
    return loggers[name];
  } else {
    const level = option?.level || process.env.LOG_LEVEL || 'info';
    const target = (option?.target || process.env.LOG_TARGET || 'console|file|cloud').split('|').reduce((accu, curr) => {
      switch (curr) {
        case 'console': return accu | CONSOLE;
        case 'file': return accu | FILE;
        case 'cloud': return accu | CLOUD;
        default: return accu;
      }}, 0);

    const transportArray = [];

    if (target & FILE) {
      transportArray.push(
        new transports.File({ filename: `./logs/app.log` }),
      );
    }
    if (target & CONSOLE)
      transportArray.push(new transports.Console());

    loggers[name] = createLogger({
      level,
      exitOnError: false,
      format: combine(label({ label: name }), timestamp(), logFormat),
      transports: transportArray,
    });
    return loggers[name];
  }
};
