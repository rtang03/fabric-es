
describe('Temp tests', () => {
  it('test behaviour of object and spread operator', () => {
    const orgn = {
      'one': '1',
      'two': '2',
      'three': '3',
      'four': 'IV'
    };

    const temp = {
      'one': 'i',
      'two': 'ii',
      'three': 'iii'
    };

    const next = {
      ...orgn,
      ...temp
    };

    console.log(JSON.stringify(orgn, null, ' '));
    console.log(JSON.stringify(next, null, ' '));
  });

  it('escape character tests', () => {
    const regex = RegExp('([^A-Za-z0-9_])', 'g');
    const text = 'Hello! I am John, how are you?';
    console.log(text.replace(regex, '\\$1'));
  });

  it('test boolean', () => {
    const test = (str: string) => (str && str.trim()) ? 'YES' : 'NO';
    expect(test(undefined)).toEqual('NO');
    expect(test(null)).toEqual('NO');
    expect(test('')).toEqual('NO');
    expect(test(' ')).toEqual('NO');
    expect(test('huh?')).toEqual('YES');
  });

  it('test reduce', () => {
    const buildTag = (separator: string, current: string, ...values: string[]): string | undefined => {
      const orignl = current || '';
      const inputs = values.filter(w => orignl.indexOf(w) < 0);
      const size = inputs.length;
      const elm1st = inputs.shift();
      const result = (size > 0) ?
        inputs.reduce((accu, curr) =>
            (curr && curr.trim()) ? accu + `${separator}${curr}` : accu,
          elm1st ? (orignl.trim() ? `${orignl}${separator}` : '') + elm1st : orignl)
        : orignl;
      return (result.trim()) ? result : undefined;
    };

    expect(buildTag(',', undefined)).toBeUndefined();
    expect(buildTag(',', undefined, undefined)).toBeUndefined();
    expect(buildTag(',', undefined, undefined, undefined)).toBeUndefined();
    expect(buildTag(',', '')).toBeUndefined();
    expect(buildTag(',', ' ')).toBeUndefined();
    expect(buildTag(',', '', '')).toBeUndefined();
    expect(buildTag(',', ' ', '')).toBeUndefined();
    expect(buildTag(',', '', ' ')).toBeUndefined();
    expect(buildTag(',', ' ', ' ')).toBeUndefined();
    expect(buildTag(',', '', '', '')).toBeUndefined();
    expect(buildTag(',', '', ' ', ' ')).toBeUndefined();
    expect(buildTag(',', ' ', '', ' ')).toBeUndefined();
    expect(buildTag(',', ' ', ' ', '')).toBeUndefined();
    expect(buildTag(',', ' ', ' ', ' ')).toBeUndefined();
    expect(buildTag(',', '', '', '', ' ')).toBeUndefined();
    expect(buildTag(',', ' ', '', ' ', '')).toBeUndefined();
    const output = `Output
    (undefined, 'hello')                 ${buildTag(',', undefined, 'hello')}
    (undefined, 'hello', 'there')        ${buildTag(',', undefined, 'hello', 'there')}
    ('hey')                              ${buildTag(',', 'hey')}
    ('hey', 'hello')                     ${buildTag(',', 'hey', 'hello')}
    ('hey', 'hello', 'there')            ${buildTag(',', 'hey', 'hello', 'there')}
    ('hey', undefined)                   ${buildTag(',', 'hey', undefined)}
    ('hey', undefined, undefined)        ${buildTag(',', 'hey', undefined, undefined)}
    ('hey', undefined, undefined, 'you') ${buildTag(',', 'hey', undefined, undefined, 'you')}
    ('hey', 'hey')                       ${buildTag(',', 'hey', 'hey')}
    ('hey', 'hello', 'hey')              ${buildTag(' ', 'hey', 'hello', 'hey')}
    ('hey,there', 'hello', 'hey')        ${buildTag(';', 'hey,there', 'hello', 'hey')}`;
    console.log(output);
  });

  it('test promise', async () => {
    const test = (input: string): Promise<void> => {
      return new Promise<void>(async (resolve, reject) => {
        console.log('test promise: do some slow things...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (input && input.trim()) {
          console.log(`test promise: OKAY!!! ${input}`);
          resolve();
        } else {
          console.log('test promise: FAIL!');
          reject();
        }
      });
    };

    test('hello')
      .then(() => console.log('1: THEN'))
      .catch(() => console.log('1: CATCH'));
    // test('there');
    // test(' ');
    // test('');
    test(undefined)
      .then(() => console.log('2: THEN'))
      .catch(() => console.log('2: CATCH'));

    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('test recursive func', () => {
    // interface Add {
    //   equal: () => number;
    //   add: (value: number) => this;
    // }
    // interface Calc {
    //   reg: (name: string) => void;
    //   add: Add;
    // }

    // const calc = () => {
    //   let user = 'john';
    //   let total;

    //   const equal = () => `Hi ${user}, the answer is ${total}`;

    //   const add = (value: number) => {
    //     return {
    //       equal: () => `Hi ${user}, the answer is ${total}`,
    //       add: (value: number) => {
    //         total += value;
    //         return this;
    //       }
    //     };
    //   };

    //   return {
    //     reg: (name: string) => {
    //       user = name;
    //       return this;
    //     },
    //     add
    //   };
    // };

    class Calc {
      private user: string;
      private total: number;
      constructor() {
        this.user = 'john';
        this.total = 0;
      }
      public add(value: number) {
        this.total += value;
        return this;
      }
      public equal() {
        return `Hi ${this.user}, the answer is ${this.total}`;
      }
    };

    const calc = new Calc();
    console.log(calc.add(1).add(2).add(3).add(4).equal());
  });

  it('test recursive func 2', () => {
    interface CALC {
      reg: (name: string) => this;
      equal: () => string;
      add: (value: number) => this;
    };

    const Calc = (): CALC => {
      let user = 'john';
      let total = 0;

      const result = {
        reg: (name: string) => {
          user = name;
          return result;
        },
        equal: () => `Hi ${user}, the answer is ${total}`,
        add: (value: number) => {
          total += value;
          return result;
        }
      };
      return result;
    };

    const calc = Calc();
    console.log(calc.reg('paul').add(1).add(2).add(3).add(4).equal());
  });

  it('test recursive func 3', () => {
    interface ADD {
      equal: () => string;
      add: (value: number) => this;
    }
    interface CALC {
      reg: (name: string) => {
        add: (value: number) => ADD;
      };
    };

    const Calc = (): CALC => {
      let user = 'john';
      let total = 0;

      const equal = () => `Hi ${user}, the answer is ${total}`;

      const add = (value: number) => {
        total += value;
        return {
          equal,
          add
        };
      };

      return {
        reg: (name: string) => {
          user = name;
          return { add };
        }
      };
    };

    const calc = Calc();
    console.log(calc.reg('rach').add(1).add(2).add(3).add(4).equal());
  });

  it('test busy wait', () => {
    const busyWait = async () => {
      let count = 0;
      for (let i = 0; i < 5999999999; i ++) {
        count ++;
      }
    };

    const start = Date.now();
    busyWait();
    const end = Date.now();
    console.log('Duration:', (end - start));
  });

  it('test Promise return', async () => {
    const test = (flag: boolean): Promise<number> => {
      return new Promise<number>(async (resolve, reject) => {
        if (!flag) {
          console.log('test Promise false 1');
          reject('test Promise error');
          console.log('test Promise false 2');
        } else {
          console.log('test Promise true 1');
          resolve(0);
          console.log('test Promise true 2');
        }
      });
    };
    const t = await test(true).catch(error => console.log('test Promise A error', error));
    console.log('test Promise A result', t);
    const f = await test(false).catch(error => console.log('test Promise B error', error));;
    console.log('test Promise B result', f);
  });

  it('test Promise flow', async () => {
    const test2 = (flag: boolean): Promise<number> => {
      return new Promise<number>(async (resolve) => {
        if (!flag) {
          resolve(1);
        } else {
          resolve(0);
        }
      });
    };
    const test1 = (flag: boolean): Promise<number> => {
      return new Promise<number>(async (resolve, reject) => {
        const result1 = await test2(flag)
          .then(result2 => {
            if (result2 !== 0) {
              reject('test Promise flow error');
            } else {
              return result2;
            }
          });
        if (result1 === undefined) return;

        console.log(`test Promise flow ${result1}`);
        resolve(0);
      });
    };
    const t = await test1(true).catch(error => console.log('test Promise flow A error', error));
    console.log('test Promise flow A result', t);
    const f = await test1(false).catch(error => console.log('test Promise flow B error', error));
    console.log('test Promise flow B result', f);
  });
});
