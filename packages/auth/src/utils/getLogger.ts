import { createLogger, format, Logger, transports } from 'winston';

const { combine, timestamp, label, json } = format;

export const getLogger: (option: { name: string; sendToConsole?: boolean }) => Logger = ({
  name,
  sendToConsole = true
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

  const consoleTransport = new transports.Console();

  if (sendToConsole) transportArray = [consoleTransport, ...transportArray];

  return createLogger({
    level: 'info',
    exitOnError: false,
    format: combine(label({ label: name }), timestamp(), json()),
    transports: transportArray
  });
};
