import { NextPageContext } from 'next';
import nextCookie from 'next-cookies';
import Router from 'next/router';

export const auth = async (ctx: NextPageContext) => {
  const { token } = nextCookie(ctx);

  if (ctx?.res && ctx?.req && !token) {
    ctx.res.writeHead(302, { Location: '/web/login' });
    ctx.res.end();
    return;
  }

  if (!token) {
    await Router.push('/web/login');
  }

  return token;
};
