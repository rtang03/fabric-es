/**
 * @packageDocumentation
 * @hidden
 */
import { createLogger, format, Logger, transports } from 'winston';
const { combine, timestamp, label, json } = format;

export const getLogger = (
  name: string,
  sendToConsole = true,
  enableGCPLogger: boolean = process.env.NODE_ENV === 'production'
) => {
  let transportArray: any[] = [
    new transports.File({ filename: `./logs/all.log` }),
    new transports.File({
      filename: `./logs/error.log`,
      level: 'error'
    }),
    new transports.File({
      filename: `./logs/debug.log`,
      level: 'debug'
    }),
    new transports.File({
      filename: `./logs/warn.log`,
      level: 'warn'
    })
  ];

  if (sendToConsole) transportArray = [new transports.Console(), ...transportArray];

  return createLogger({
    level: 'info',
    exitOnError: false,
    format: combine(label({ label: name }), timestamp(), json()),
    transports: transportArray
  });
};
