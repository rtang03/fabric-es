import { NextPageContext } from 'next';

export const getApiUrl = () => async ({ req }: NextPageContext) => {
  // const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
  return {
    apiUrl:
      typeof window === 'undefined'
        ? `${protocol}://${req?.headers.host}/web/api`
        : `${protocol}://${window.location.host}/web/api`
  };
};
