import { Snackbar } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import LinearProgress from '@material-ui/core/LinearProgress';
import Head from 'next/head';
import Link from 'next/link';
import React, { useCallback } from 'react';
import { useAlert, useDispatchAlert } from './AlertProvider';

// const logout = async () => {
//   const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
//   if (typeof window !== 'undefined') {
//     await fetch(`${protocol}://${window.location.host}/web/api/logout`);
//     await Router.push('/web/login');
//   }
// };

const Layout: React.FC<{
  title?: string;
  loading?: boolean;
}> = ({ children, title = 'No title', loading }) => {
  const alert = useAlert();
  const dispatch = useDispatchAlert();
  const handleClose = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          color: #333;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
            Arial, Noto Sans, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
            'Noto Color Emoji';
        }
        .container {
          max-width: 65rem;
          margin: 1.5rem auto;
          padding-left: 1rem;
          padding-right: 1rem;
        }
      `}</style>
      <header>
        <nav>
          <Link href="/">
            <a>Home</a>
          </Link>{' '}
          |{' '}
          <Link href="/control/register">
            <a>Register</a>
          </Link>{' '}
          |{' '}
          <Link href="/control/login">
            <a>Log in</a>
          </Link>
        </nav>
      </header>
      {loading ? <LinearProgress /> : <Divider />}
      {children}
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={!!alert.message}
        autoHideDuration={3000}
        onClose={handleClose}
        message={alert.message}
      />
    </div>
  );
};

export default Layout;
