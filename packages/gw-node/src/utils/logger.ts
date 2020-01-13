import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  exitOnError: false,
  format: format.json(),
  transports: [
    new transports.File({ filename: `./logs/all.log` }),
    new transports.File({ filename: `./logs/debug.log`, level: 'debug' }),
    new transports.File({
      filename: `./logs/error.log`,
      level: 'error'
    })
  ]
});
