import { createLogger, format, Logger, transports } from 'winston';

const { combine, timestamp, label, printf } = format;
const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level}]: ${message} (${label})`;
});

const CONSOLE = 1;
const FILE = 2;
const CLOUD = 4;
const loggers: Record<string, Logger> = {};

export const getLogger: (
  option: {
    name: string;
    level?: string;
    target?: string; // console|file|cloud
  }
) => Logger = ({
  name, level, target
}) => {
  if (loggers[name]) {
    return loggers[name];
  } else {
    const logLevel = level || process.env.LOG_LEVEL || 'info';
    const logTarget = (target || process.env.LOG_TARGET || 'console|file|cloud').split('|').reduce((accu, curr) => {
      switch (curr) {
        case 'console': return accu | CONSOLE;
        case 'file': return accu | FILE;
        case 'cloud': return accu | CLOUD;
        default: return accu;
      }}, 0);

    const transportArray = [];

    if (logTarget & FILE) {
      transportArray.push(
        new transports.File({ filename: `./logs/app.log` }),
      );
    }
    if (logTarget & CONSOLE)
      transportArray.push(new transports.Console());

    loggers[name] = createLogger({
      level: logLevel,
      exitOnError: false,
      format: combine(label({ label: name }), timestamp(), logFormat),
      transports: transportArray,
    });
    return loggers[name];
  }
};
