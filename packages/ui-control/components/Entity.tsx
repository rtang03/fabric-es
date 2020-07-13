import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import clsx from 'clsx';
import React, { useState } from 'react';
import { useStyles } from '../utils';

const EntityComponent: React.FC<{ entity: any }> = ({ entity }) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const handleExpand = () => setExpanded(!expanded);

  return (
    <Box margin={1}>
      <Card style={{ maxWidth: 550 }}>
        <CardHeader
          avatar={
            <Avatar aria-label="entity" className={classes.avatar}>
              {entity.entityName.slice(0, 2).toUpperCase()}
            </Avatar>
          }
          title={entity.entityName}
          subheader={entity.id}
        />
        <Divider />
        <CardContent>
          <Box margin={2}>
            <Typography variant="body2" color="textSecondary" component="p">
              {entity?.desc || ''}
            </Typography>
          </Box>
          <Box margin={2}>
            <Typography variant="body2" color="primary" component="p">
              tag: {entity?.tag || ''}
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" component="p">
            last: {entity.lastModified}
          </Typography>
          <Typography variant="caption" color="textSecondary" component="p">
            created: {entity.created}
          </Typography>
        </CardContent>
        <CardActions disableSpacing>
          <IconButton
            className={clsx(classes.expand, {
              [classes.expandOpen]: expanded,
            })}
            onClick={handleExpand}
            aria-expanded={expanded}
            aria-label="show more">
            <ExpandMoreIcon />
          </IconButton>
        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Typography variant="h6" color="textSecondary">
              Details
            </Typography>
            <pre>
              <Typography variant="caption" color="textSecondary">
                {JSON.stringify(entity, null, 2)}
              </Typography>
            </pre>
          </CardContent>
        </Collapse>
      </Card>
      <br />
    </Box>
  );
};

export default EntityComponent;
