export const waitForSecond = async (second: number) => {
  const timer = new Promise(done => {
    setTimeout(() => done(), second);
  });

  await timer;
};