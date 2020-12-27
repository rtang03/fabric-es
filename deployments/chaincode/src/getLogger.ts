import { createLogger, format, Logger, transports } from 'winston';

const { combine, timestamp, label, printf } = format;
const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level}]: ${message} (${label})`;
});
const loggers: Record<string, Logger> = {};

export const getLogger = (name: string, sendToConsole = true) => {
  if (loggers[name]) {
    return loggers[name];
  } else {
    let transportArray: any[] = [
      new transports.File({ filename: `./logs/all.log` }),
    ];

    if (sendToConsole) transportArray = [new transports.Console(), ...transportArray];

    loggers[name] = createLogger({
      level: 'info',
      exitOnError: false,
      format: combine(label({ label: name }), timestamp(), logFormat),
      transports: transportArray,
    });
    return loggers[name];
  }
};
