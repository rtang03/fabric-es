import cookie from 'js-cookie';

let accessToken = '';

export const setAccessToken = (s: string) => {
  accessToken = s;
};

// export const getAccessToken = () => accessToken;

export const getAccessToken = () => cookie.get('jid');
