
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
});
