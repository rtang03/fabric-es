import fetch from 'isomorphic-unfetch';
import { GetServerSidePropsContext } from 'next';
import nextCookie from 'next-cookies';
import { isUser } from './typeGuard';

const port = process.env.PORT;

export const getServerSideUser = () => async (context: GetServerSidePropsContext) => {
  const entityId = context.query.entityId;
  const entityName = context.query.entityName;
  const noUser = { props: { user: null } };
  const { token } = nextCookie(context);
  const query = `query Me {
    me {
      id
      username
      is_deleted
      is_admin
    }
  }`;

  let response;

  try {
    response = await fetch(`http://localhost:${port}/control/api/graphql`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        authorization: `bearer ${token}`,
        mode: 'cors',
      },
      body: JSON.stringify({ operationName: 'Me', query }),
    });
  } catch (e) {
    console.error('fail to fetch data: ', e);
    return noUser;
  }

  if (response.status !== 200) return noUser;

  try {
    const result = await response.json();
    const user = result?.data?.me;

    if (result?.errors) return noUser;

    const props: any = { props: { user } };
    entityId && (props.props.entityId = entityId);
    entityName && (props.props.entityName = entityName);

    return user && isUser(user) ? props : noUser;
  } catch (e) {
    console.error('fail to parse response: ', e);
    return noUser;
  }
};
