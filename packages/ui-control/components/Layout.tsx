import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Snackbar from '@material-ui/core/Snackbar';
import Toolbar from '@material-ui/core/Toolbar';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import MemoryIcon from '@material-ui/icons/Memory';
import { useLogoutMutation } from 'graphql/generated';
import Head from 'next/head';
import Link from 'next/link';
import Router from 'next/router';
import React, { useCallback, useEffect } from 'react';
import { User } from 'types';
import { saveToken, useStyles } from '../utils';
import { useAlert, useDispatchAlert } from './AlertProvider';
import { useDispatchAuth } from './AuthProvider';

const Layout: React.FC<{
  title?: string;
  loading?: boolean;
  user?: User | null;
  restricted?: boolean;
}> = ({ children, title = 'No title', loading, user, restricted }) => {
  const classes = useStyles();
  const alert = useAlert();
  const dispatchAlert = useDispatchAlert();
  const dispatchAuth = useDispatchAuth();
  const handleClose = useCallback(() => dispatchAlert({ type: 'CLEAR' }), []);
  const [logout, { data: logoutResult }] = useLogoutMutation();

  // menu button for accountCircle
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenu = ({ currentTarget }: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(currentTarget);
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // when authenticated
  user && setTimeout(() => dispatchAuth({ type: 'LOGIN_SUCCESS', payload: { user } }), 100);

  // after logout
  useEffect(() => {
    if (logoutResult?.logout) {
      setTimeout(() => dispatchAlert({ type: 'SUCCESS', message: 'Log out' }), 500);
      setTimeout(() => {
        dispatchAuth({ type: 'LOGOUT' });
        window.localStorage.setItem('logout', Date.now().toString());
        saveToken(null);
      }, 2500);
      setTimeout(async () => Router.push(`/control/login`), 3000);
    }
  }, [logoutResult]);

  // unauthorized access
  useEffect(() => {
    if (!user && restricted) {
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
        a {
          color: inherit;
          text-decoration: none;
        }
        .container {
          max-width: 65rem;
          margin: 1.5rem auto;
          padding-left: 1rem;
          padding-right: 1rem;
        }
      `}</style>
      <header>
        <div className={classes.root}>
          <AppBar position="static">
            <Toolbar>
              <IconButton
                edge="start"
                className={classes.menuButton}
                color="inherit"
                aria-label="menu">
                <MemoryIcon />
              </IconButton>
              <div className={classes.root}>
                <Button color="inherit">
                  <Link href="/control">
                    <a>Home</a>
                  </Link>
                </Button>
                {user ? (
                  <>
                    <Button color="inherit">
                      <Link href="/control/dashboard">
                        <a>Dashboard</a>
                      </Link>
                    </Button>
                  </>
                ) : (
                  <React.Fragment />
                )}
              </div>
              {user ? (
                <div>
                  <IconButton
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit">
                    <AccountCircleIcon />
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={open}
                    onClose={handleClose}>
                    <MenuItem onClick={handleMenuClose}>
                      <Link href="/control/profile">
                        <a>Profile</a>
                      </Link>
                    </MenuItem>
                  </Menu>
                  <IconButton color="inherit" onClick={() => logout()}>
                    <ExitToAppIcon />
                  </IconButton>
                </div>
              ) : (
                <>
                  <Button color="inherit">
                    <Link href="/control/register">
                      <a>Register</a>
                    </Link>
                  </Button>
                  <Button color="inherit">
                    <Link href="/control/login">
                      <a>Log in</a>
                    </Link>
                  </Button>
                </>
              )}
            </Toolbar>
          </AppBar>
        </div>
      </header>
      {loading ? <LinearProgress /> : <Divider />}
      <br />
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
