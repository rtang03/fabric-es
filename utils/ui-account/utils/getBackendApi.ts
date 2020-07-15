import { NextPageContext } from 'next';

export const getBackendApi = (ctx: NextPageContext, path: string) => {
  const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
  return typeof window === 'undefined'
    ? `${protocol}://${ctx.req?.headers.host}/web/api/${path}`
    : `${protocol}://${window.location.host}/web/api/${path}`;
};
