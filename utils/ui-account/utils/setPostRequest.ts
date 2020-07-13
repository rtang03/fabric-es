export const setPostRequest = (body: any, useCors?: boolean) => {
  const request: any = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };

  if (useCors) request.mode = 'cors';

  return request;
};
