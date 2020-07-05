import { GetServerSidePropsContext } from 'next';
import nextCookie from 'next-cookies';

const port = process.env.PORT;

export const getServerSideUser = () => async (context: GetServerSidePropsContext) => {
  const endpoint = `http://localhost:${port}/control/api/graphql`;
  const noToken = { props: { accessToken: null } };
  const existingToken = nextCookie(context)?.rt;
  const query = `mutation RefreshToken ( $token: String! ) {
    refreshToken( token: $token ) {
      access_token
      refresh_token
    }
  }`;

  let response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        mode: 'same-origin',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        operationName: 'RefreshToken',
        query,
        variables: { token: existingToken },
      }),
    });

    if (response.status !== 200) {
      console.log('ExistingToken', existingToken);
      console.log(response.status);
      const error = await response.text();
      console.log('Error', error);
      return noToken;
    }

    const result = await response.json();
    const newRefreshToken = result?.data?.refreshToken;

    return result?.errors ? noToken : { props: { accessToken: newRefreshToken.access_token } };
  } catch (e) {
    console.error('fail to parse response: ', e);
    return noToken;
  }
};
