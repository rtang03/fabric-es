import Divider from '@material-ui/core/Divider';
import LinearProgress from '@material-ui/core/LinearProgress';
import Snackbar from '@material-ui/core/Snackbar';
import Head from 'next/head';
import Link from 'next/link';
import Router from 'next/router';
import React, { useCallback, useEffect } from 'react';
import { useLogoutMutation } from '../graphql/generated';
import { User } from '../types';
import { useAlert, useDispatchAlert } from './AlertProvider';
import { useAuth, useDispatchAuth } from './AuthProvider';

const Layout: React.FC<{
  title?: string;
  loading?: boolean;
  user?: User;
}> = ({ children, title = 'No title', loading, user }) => {
  const auth = useAuth();
  const alert = useAlert();
  const dispatchAlert = useDispatchAlert();
  const dispatchAuth = useDispatchAuth();
  const handleClose = useCallback(() => dispatchAlert({ type: 'CLEAR' }), []);
  const [logout, { data: logoutResult }] = useLogoutMutation();

  useEffect(() => {
    if (logoutResult?.logout) {
      setTimeout(() => dispatchAlert({ type: 'SUCCESS', message: 'Log out' }), 500);
      setTimeout(() => dispatchAuth({ type: 'LOGOUT' }), 3500);
      setTimeout(async () => Router.push(`/control`), 4000);
    }
  }, [logoutResult]);

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
          <Link href="/control">
            <a>Home</a>
          </Link>{' '}
          |
          {auth.loggedIn ? (
            <>
              <Link href="/control/dashboard">
                <a>Dashboard</a>
              </Link>{' '}
              | <a onClick={() => logout()}>Log out</a>
            </>
          ) : (
            <>
              <Link href="/control/register">
                <a>Register</a>
              </Link>{' '}
              |{' '}
              <Link href="/control/login">
                <a>Log in</a>
              </Link>{' '}
            </>
          )}
        </nav>
      </header>
      {loading ? <LinearProgress /> : <Divider />}
      {children}
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={!!alert?.message}
        autoHideDuration={3000}
        onClose={handleClose}
        message={alert?.message}
      />
    </div>
  );
};

export default Layout;
