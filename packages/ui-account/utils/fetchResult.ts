import { NextPageContext } from 'next';
import nextCookie from 'next-cookies';
import Router from 'next/router';
import { getBackendApi } from './getBackendApi';

export const redirectOnError = (ctx: NextPageContext) =>
  (process as any).browser ? Router.push('/web/login') : (ctx as any).res.writeHead(301, { Location: '/web/login' });

export const fetchResult: <T>(ctx: NextPageContext, path: string) => Promise<T> = async <T = any>(
  ctx: NextPageContext,
  path: string
) => {
  const { token } = nextCookie(ctx);
  const apiUrl = getBackendApi(ctx, path);

  try {
    const response = await fetch(apiUrl, {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (response.ok) {
      return response.json();
    } else {
      // https://github.com/developit/unfetch#caveats
      return redirectOnError(ctx);
    }
  } catch (error) {
    console.error(error);
    // Implementation or Network error
    return redirectOnError(ctx);
  }
};
