export * from './domain/entities';
export * from './domain/types';
export * from './command-handler';
// export * from './queries/example-document';
// export * from './queries/trade';
// export * from './queries/user';

export type CommandHandler<T> = { [C in keyof T]: (command: T[C]) => Promise<any> };