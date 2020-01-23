import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, json } = format;

export const getLogger = (name: string) =>
  createLogger({
    level: 'info',
    exitOnError: false,
    format: combine(label({ label: name }), timestamp(), json()),
    transports: [
      new transports.Console(),
      new transports.File({ filename: `./logs/all.log` }),
      new transports.File({
        filename: `./logs/error.log`,
        level: 'error'
      }),
      new transports.File({
        filename: `./logs/debug.log`,
        level: 'debug'
      })
    ]
  });
