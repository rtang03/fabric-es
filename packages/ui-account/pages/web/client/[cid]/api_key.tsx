import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import { Form, Formik } from 'formik';
import fetch from 'isomorphic-unfetch';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Layout from '../../../../components/Layout';
import { ApiKey, Client, User } from '../../../../server/types';
import { fetchBFF, getBackendApi, postResultRouting, setPostRequest, useStyles } from '../../../../utils';

const ApiKeyPage: NextPage<{ user: User; apiKeys: ApiKey[]; apiUrl: string; client: Client }> = ({
  user,
  apiKeys,
  apiUrl,
  client
}) => {
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();
  const { cid } = router.query;
  const classes = useStyles();
  const handleChange = () => ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setEditMode(target.checked);
  };

  return (
    <Layout title="Client | api key" user={user}>
      <Typography variant="h6">Application name: {client.application_name}</Typography>
      <Typography variant="caption">Api key</Typography>
      {isEqual(apiKeys, []) ? (
        <p>No api exist</p>
      ) : (
        <List>
          {apiKeys.map(key => (
            <div key={key.id}>
              <Formik
                initialValues={{}}
                onSubmit={async (_, { setSubmitting }) => {
                  setSubmitting(true);
                  try {
                    const res = await fetch(`${apiUrl}/${key.id}`, {
                      method: 'DELETE',
                      headers: { 'Access-Control-Allow-Origin': '*' },
                      mode: 'cors'
                    });
                    const result = await res.json();
                    setSubmitting(false);
                    await postResultRouting(res.status, `/web/client/${cid}/api_key`, 'fail to delete api_key');
                  } catch (e) {
                    console.error(e);
                    setSubmitting(false);
                  }
                }}>
                {({ isSubmitting }) => (
                  <ListItem>
                    <Form>
                      <ListItemText primary={JSON.stringify(pick(key, 'id', 'scope'), null, 2)} />
                      <Button
                        className={classes.submit}
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                        type="submit">
                        Delete
                      </Button>
                    </Form>
                  </ListItem>
                )}
              </Formik>
            </div>
          ))}
        </List>
      )}
      <Divider />
      <p/>
      <FormGroup row>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={editMode}
              onChange={handleChange()}
              value="editMode"
              color={editMode ? 'primary' : 'secondary'}
            />
          }
          label={editMode ? 'Lock' : 'Unlock'}
        />
      </FormGroup>
      <Formik
        initialValues={{}}
        onSubmit={async (_, { setSubmitting }) => {
          setSubmitting(true);
          try {
            const res = await fetch(
              `${apiUrl}/request_access`,
              setPostRequest({ client_id: client.id, client_secret: client.client_secret }, true)
            );
            const result = await res.json();
            setSubmitting(false);
            await postResultRouting(res.status, `/web/client/${cid}/api_key`, 'fail to request access');
          } catch (e) {
            console.error(e);
            setSubmitting(false);
          }
        }}>
        {({ isSubmitting }) => (
          <Form>
            {' '}
            <Button
              className={classes.submit}
              variant="contained"
              color="primary"
              disabled={isSubmitting || !editMode}
              type="submit">
              Request API Key
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

ApiKeyPage.getInitialProps = async ctx => {
  const user = await fetchBFF<User>(ctx, 'profile');
  const apiKeys = await fetchBFF<ApiKey[]>(ctx, `api_key?client_id=${ctx?.query?.cid}`);
  const client = await fetchBFF<Client>(ctx, `client/${ctx?.query?.cid}`);
  const apiUrl = getBackendApi(ctx, 'api_key');
  return { user, apiKeys, apiUrl, client };
};

export default ApiKeyPage;
