import moment from 'moment-timezone';
import { createLogger, format, Logger, transports } from 'winston';

const { combine, label, printf } = format;
const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level}]: ${message} (${label})`;
});

// timezone setting
const appendTimestamp = format((info, opts) => {
  if (opts.tz) info.timestamp = moment().tz(opts.tz).format();
  return info;
});

const CONSOLE = 1;
const FILE = 2;
const CLOUD = 4;
const loggers: Record<string, Logger> = {};

export const getLogger = (name: string, option?: {
  level?: string;
  target?: string; // console|file|cloud
  timezone?: string; // default Asia/Hong_Kong
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
      }
    }, 0);
    const logTimezone = option?.timezone || process.env.TZ || 'Asia/Hong_Kong';
    const transportArray = [];

    if (target & FILE) {
      transportArray.push(
        new transports.File({ filename: `./logs/all.log` }),
      );
    }
    if (target & CONSOLE)
      transportArray.push(new transports.Console());

    loggers[name] = createLogger({
      level,
      exitOnError: false,
      format: combine(label({ label: name }), appendTimestamp({ tz: logTimezone }), logFormat),
      transports: transportArray,
    });
    return loggers[name];
  }
};
