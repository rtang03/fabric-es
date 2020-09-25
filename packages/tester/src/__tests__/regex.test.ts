require('dotenv').config({ path: './.env' });

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
});

const dsplit = (input: string, separator = ',', delimiter = '"'): string[] => {
  const regex1 = new RegExp(`${separator}?((?<!\\\\)${delimiter}.+?(?<!\\\\)${delimiter})${separator}?`); // Split quoted parts first
  const regex2 = new RegExp(`((?<!\\\\)${delimiter}|\\\\)+`, 'g');  // Remove quotes from quoted parts
  return input
    .split(regex1).filter(v => v)
    .reduce((a, c) => (c.includes(delimiter)) ? [...a, c.replace(regex2, '')] : [...a, ...c.split(separator)], []);
};

const djoin = (input: string[], separator = ',', delimiter = '"'): string => {
  const regex = new RegExp(`${delimiter}`, 'g');
  return input.reduce((a, c) => {
    const delim = `\\${delimiter}`;
    const d = c.replace(regex, delim);
    const needDelimit = d.includes(separator) || (d.includes(delim) && !(d.startsWith(delim) && d.endsWith(delim)));
    return `${a ? `${a}${separator}` : ''}${needDelimit ? `${delimiter}${d}${delimiter}` : d}`;
  }, '');
};

describe('Regex tests', () => {
  // it('test delimited split', () => {
  //   console.log(dsplit(''));
  //   console.log(dsplit('Hello,How,Are,You,"Smith,Will",This,Is,A,Test'));
  //   console.log(dsplit('"Smith,Will",Hello,How,Are,You,This,Is,A,Test'));
  //   console.log(dsplit('Hello,How,Are,You,This,Is,A,Test,"Smith,Will"'));
  //   console.log(dsplit('Hello,"Doe,John",How,Are,You,"Smith,Will",This,Is,A,Test'));
  //   console.log(dsplit('"Doe,John",Hello,How,Are,You,This,Is,A,Test,"Smith,Will"'));
  //   console.log(dsplit('"Doe,John",Hello,How,Are,You,"Li,Four","Zheng,Three",This,Is,A,Test,"Smith,Will!"'));
  //   console.log(dsplit('"Doe,John","Hello,How","Are,You","Li,Four","This,Is,A",Test,"Smith,Will!"'));
  // });

  // it('test escaped delimiter', () => {
  //   console.log(dsplit('field1:Value1,field2:Value2,"field3:\\"Value:Three\\"","field4:Value,Four",field5:Value5'));
  // });

  // it('test customized separator and delimiter', () => {
  //   console.log(dsplit('field1:ValueA"field2:ValueB";field3:\\;Value:See\\;;";field4:Value"Dee;"field5:ValueE', '"', ';'));
  // });

  // it('test tuples', () => {
  //   console.log(dsplit('field:value', ':'));
  // });

  it('ultimate test', () => {
    const updates = {
      field0: 'Zero,0',
      field1: '"Value1"',
      field2: '2:Two',
      fieldX: '"HAHA,HEHE"',
      fieldY: '"YO,YO:MO,MO'
    };
    const originl = dsplit('field1:Value1,field2:Value2,"field3:\\"Value:Three\\"","field4:Value,Four",field5:Value5').reduce((a, c) => {
      const w = dsplit(c, ':');
      if (w.length === 2) return { ...a, [w[0]]: w[1] };
    }, {});
    const result0: Record<string, string> = {
      ...originl,
      ...updates
    };
    console.log('0', result0);
    const result1 = djoin(Object.entries(result0).map(r => djoin(r, ':')));
    console.log('1', result1);

    const result2: Record<string, string> = dsplit(result1).reduce((a, c) => {
      const w = dsplit(c, ':');
      if (w.length === 2) return { ...a, [w[0]]: w[1] };
    }, {});
    console.log('2', result2);
    const result3 = djoin(Object.entries(result2).map(r => djoin(r, ':')));
    console.log('3', result3);

    const result4: Record<string, string> = dsplit(result3).reduce((a, c) => {
      const w = dsplit(c, ':');
      if (w.length === 2) return { ...a, [w[0]]: w[1] };
    }, {});
    console.log('4', result4);
    const result5 = djoin(Object.entries(result4).map(r => djoin(r, ':')));
    console.log('5', result5);

    expect(result5).toEqual(result3);
  });

  it('ultimate test 2', () => {
    const originl = '';
    const result0: Record<string, string> = dsplit(originl).reduce((a, c) => {
      const w = dsplit(c, ':');
      if (w.length === 2) return { ...a, [w[0]]: w[1] };
    }, {});
    console.log('A', result0);
    const result1 = djoin(Object.entries(result0).map(r => djoin(r, ':')));
    console.log('B', result1);

    expect(result1).toEqual(originl);
  });
});