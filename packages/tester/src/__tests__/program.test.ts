require('dotenv').config({ path: './.env' });

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
});

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

  it('test environment variables 2', () => {
    const value = parseInt(process.env.NONEXISTING, 10) || 2345;
    console.log(value);
  });
});

type Needed = {
  field1: string;
  field2: number;
  field3: string;
};

const needed: (keyof Needed)[] = ['field1', 'field2', 'field3'];

const src = `{
  "field0": "hello",
  "field1": "how",
  "field2": "are",
  "field3": "you",
  "field4": "today"
}`;

describe('type related tests', () => {
  it('test interface vs objects', () => {
    const v0 = JSON.parse(src);
    const v1 = needed.reduce((accu, curr) => ({
      ...accu, [curr]: v0[curr]
    }), {});
    console.log('1', JSON.stringify(v1, null, ' '));
  });
});