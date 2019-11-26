import Typography from '@material-ui/core/Typography';
import React from 'react';

const DisplayErrorMessage: React.FC<any> = (error: any) =>
  error?.message ? (
    <p>
      <Typography variant="caption" color="textSecondary">
        {error.message.split(':')[1]}
      </Typography>
    </p>
  ) : (
    <div />
  );

export default DisplayErrorMessage;
