//import { LoggingWinston } from '@google-cloud/logging-winston';
import { createLogger, format, Logger, transports } from 'winston';

const { combine, timestamp, label, json } = format;

export const getLogger: (option: { name: string; sendToConsole?: boolean; enableGCPLogger?: boolean }) => Logger = ({
  name,
  sendToConsole = true,
  enableGCPLogger = process.env.NODE_ENV === 'production'
}) => {
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

//  const loggingWinston = new LoggingWinston({
//    projectId: 'fdi'
//  });

  const consoleTransport = new transports.Console();

  if (sendToConsole) transportArray = [consoleTransport, ...transportArray];

//  if (enableGCPLogger) transportArray = [loggingWinston, ...transportArray];

  return createLogger({
    level: 'info',
    exitOnError: false,
    format: combine(label({ label: name }), timestamp(), json()),
    transports: transportArray
  });
};
