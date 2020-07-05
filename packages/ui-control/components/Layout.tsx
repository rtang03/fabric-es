import Divider from '@material-ui/core/Divider';
import LinearProgress from '@material-ui/core/LinearProgress';
import Snackbar from '@material-ui/core/Snackbar';
import { useLogoutMutation } from 'graphql/generated';
import Head from 'next/head';
import Link from 'next/link';
import Router from 'next/router';
import React, { useCallback, useEffect } from 'react';
import { User } from 'types';
import { useAlert, useDispatchAlert } from './AlertProvider';
import { useDispatchAuth } from './AuthProvider';

const Layout: React.FC<{
  title?: string;
  loading?: boolean;
  user?: User | null;
  restrictedArea?: boolean;
}> = ({ children, title = 'No title', loading, user, restrictedArea }) => {
  const alert = useAlert();
  const dispatchAlert = useDispatchAlert();
  const dispatchAuth = useDispatchAuth();
  const handleClose = useCallback(() => dispatchAlert({ type: 'CLEAR' }), []);
  const [logout, { data: logoutResult }] = useLogoutMutation();

  user && setTimeout(() => dispatchAuth({ type: 'LOGIN_SUCCESS', payload: { user } }), 100);

  useEffect(() => {
    if (logoutResult?.logout) {
      setTimeout(() => dispatchAlert({ type: 'SUCCESS', message: 'Log out' }), 500);
      setTimeout(() => dispatchAuth({ type: 'LOGOUT' }), 2500);
      setTimeout(async () => Router.push(`/control/login`), 3000);
    }
  }, [logoutResult]);

  useEffect(() => {
    if (!user && restrictedArea) {
      setTimeout(async () => logout(), 2000);
      setTimeout(() => {
        dispatchAlert({ type: 'ERROR', message: 'log-in required' });
      }, 100);
    }
  }, [user]);

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
          {user ? (
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
        autoHideDuration={2000}
        onClose={handleClose}
        message={alert?.message}
      />
    </div>
  );
};

export default Layout;
