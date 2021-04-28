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

export const getLogger: (
  option: {
    name: string;
    level?: string;
    target?: string; // console|file|cloud
    timezone?: string; // default Asia/Hong_Kong
  }
) => Logger = ({
  name, level, target, timezone
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
        }
      }, 0);
      const logTimezone = timezone || process.env.TZ || 'Asia/Hong_Kong';
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
        format: combine(label({ label: name }), appendTimestamp({ tz: logTimezone }), logFormat),
        transports: transportArray,
      });
      return loggers[name];
    }
  };
