import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: 'info',
  exitOnError: false,
  format: format.json(),
  transports: [
    new transports.File({ filename: `./logs/fabric-cqrs.log` }),
    new transports.File({
      filename: `./logs/error.log`,
      level: 'error'
    }),
    // new transports.File({
    //   filename: `./logs/debug.log`,
    //   level: 'debug'
    // })
  ]
});