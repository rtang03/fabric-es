import Badge from '@material-ui/core/Badge';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import CheckboxIcon from '@material-ui/icons/CheckBox';
import CheckboxOutlineIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import NotificationsIcon from '@material-ui/icons/Notifications';
import {
  useGetNotificationsQuery,
  useGetNotificationLazyQuery,
  Notification,
} from 'graphql/generated/queryHandler';
import React, { useState } from 'react';

const ITEM_HEIGHT = 48;

const NotificationComponent: React.FC<any> = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenu = ({ currentTarget }: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const { data, loading, refetch } = useGetNotificationsQuery({
    context: { backend: 'queryHandler' },
    fetchPolicy: 'network-only',
    pollInterval: 5000,
  });
  const [getOne] = useGetNotificationLazyQuery({ context: { backend: 'queryHandler' } });
  const handleRead = (entityName: string, id: string, commitId: string) => async () => {
    getOne({ variables: { entityName, id, commitId } });
    await refetch();
  };

  let notifications: Notification[] = [];

  if (!loading) notifications = data?.getNotifications || [];

  return (
    <>
      <IconButton
        aria-label="show new notifications"
        aria-controls="menu-noti"
        aria-haspopup="true"
        onClick={handleMenu}
        color="inherit">
        <Badge badgeContent={notifications.filter(({ read }) => !read).length} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="menu-noti"
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
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: '20ch',
          },
        }}>
        {notifications.length ? (
          notifications.map(({ entityName, id, commitId, read }) => (
            <MenuItem key={commitId} onClick={handleRead(entityName, id, commitId)}>
              {read ? (
                <CheckboxIcon color="primary" fontSize="small" />
              ) : (
                <CheckboxOutlineIcon color="primary" fontSize="small" />
              )}
              <Typography color="primary" variant="caption">
                {commitId}
              </Typography>
            </MenuItem>
          ))
        ) : (
          <MenuItem>
            <Typography color="primary" variant="caption">
              No info
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default NotificationComponent;
