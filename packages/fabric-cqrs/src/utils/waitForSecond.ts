export const waitForSecond = async (second: number) => {
  const timer = new Promise((done) => {
    setTimeout(() => done(), second * 1000);
  });

  await timer;
};
