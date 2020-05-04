import httpStatus from 'http-status';
import Router from 'next/router';

export const postResultRouting = async (status: number, routeTo: string, errMessage: string, callback?: any) => {
  if (status === httpStatus.OK) {
    if (callback) await callback();
    await Router.push(routeTo);
  } else if (status === httpStatus.UNAUTHORIZED) {
    console.warn('not authorized');
    await Router.push('/web/login');
  } else {
    console.error(errMessage);
    // do something to handler error
  }
};
