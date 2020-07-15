import httpStatus from 'http-status';
import Router from 'next/router';

export const postResultRouting = async (status: number, routeTo: string, errMessage: string, callback?: any) => {
  if (status === httpStatus.OK) {
    if (callback) await callback();
    await Router.push(routeTo);
    return;
  } else if (status === httpStatus.UNAUTHORIZED) {
    console.warn('not authorized');
    return 'Fail to authenticate';
  } else {
    console.error(errMessage);
    return errMessage;
  }
};
