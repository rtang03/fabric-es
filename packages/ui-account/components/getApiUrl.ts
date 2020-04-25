import { NextPageContext } from 'next';

export const getApiUrl = () => async ({ req }: NextPageContext) => {
  // const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
  return {
    apiUrl: (process as any).browser
      ? `${protocol}://${window.location.host}/web/api`
      : `${protocol}://${req?.headers.host}/web/api`
  };
};
