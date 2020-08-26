
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
});
