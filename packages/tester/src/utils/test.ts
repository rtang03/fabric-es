
(() => {
  const values = [{
    a: 'hello',
    b: 'there',
    c: 'how',
    d: 'are you',
    e: '?',
  }, {
    a: 'hello',
    c: 'how',
    d: 'are you',
    e: '?',
  }];

  for (const value of values) {
    const { a, b, c, ...r} = value;
    console.log(a, b, c, r);
  }
})();