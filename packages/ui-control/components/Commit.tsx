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
import { Commit } from 'graphql/generated/queryHandler';
import React, { useState } from 'react';
import { useStyles } from '../utils';

const CommitComponent: React.FC<{ commit: Commit }> = ({ commit }) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const handleExpand = () => setExpanded(!expanded);
  const events: any[] = (commit as any).events;
  const eventTypes = events.map(({ type }) => type).reduce((prev, curr) => `${prev} ${curr}`, '');

  return (
    <Box margin={1}>
      <Card style={{ maxWidth: 550 }}>
        <CardHeader
          avatar={
            <Avatar aria-label="entity" className={classes.avatar}>
              {commit?.entityName?.slice(0, 2).toUpperCase()}
            </Avatar>
          }
          title={commit.entityName}
          subheader={commit.id}
        />
        <Divider />
        <CardContent>
          <Box margin={2}>
            <Typography variant="caption" color="textSecondary" component="p">
              commitId: {commit.commitId}
            </Typography>
          </Box>
          <Box margin={2}>
            <Typography variant="caption" color="textSecondary" component="p">
              version: {commit.version}
            </Typography>
          </Box>
          <Box margin={2}>
            <Typography variant="caption" color="textSecondary" component="p">
              event-type: {eventTypes}
            </Typography>
          </Box>
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
                {JSON.stringify(commit, null, 2)}
              </Typography>
            </pre>
          </CardContent>
        </Collapse>
      </Card>
      <br />
    </Box>
  );
};

export default CommitComponent;
