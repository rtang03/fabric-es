require('dotenv').config({ path: './.env' });

describe('Programming tests', () => {
  it('test environment variables 1', () => {
    const tester: (option: {
      level?: string;
      target?: string;
    }) => {
      level: string;
      target: number;
    } = ({ level, target }) => {
      const lvl = level || process.env.LOG_LVL || 'error';
      const logLevel = level || process.env.LOG_LEVEL || 'error';
      const logTarget = target || process.env.LOG_TARGET || 'console|file|cloud';
      return {
        lvl,
        level: logLevel,
        target: logTarget.split('|').reduce((accu, curr) => {
          switch (curr) {
            case 'console':
              return accu | 1;
            case 'file':
              return accu | 2;
            case 'cloud':
              return accu | 4;
            default:
              return accu;
          }
        }, 0)
      };
    };

    expect(tester({}))
      .toEqual({ lvl: 'error', level: 'info', target: 3 }); // default | .env | .env

    expect(tester({ level: 'debug' }))
      .toEqual({ lvl: 'debug', level: 'debug', target: 3 }); // input | input | .env

    expect(tester({ target: 'console' }))
      .toEqual({ lvl: 'error', level: 'info', target: 1 }); // default | .env | input

    expect(tester({ level: 'verbose', target: 'file' }))
      .toEqual({ lvl: 'verbose', level: 'verbose', target: 2 }); // input | input | input
  });
});
