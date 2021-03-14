import type { Did } from '../types';

const queryStringToObject = (queryString: string): Record<string, any> => {
  const params = new URLSearchParams(queryString);
  const result = {};
  for (const [key, value] of params[Symbol.iterator]) {
    // each 'entry' is a [key, value] tupple
    result[key] = value;
  }
  return result;
};

export const parseDid = (didUrl: string): Did => {
  const reFragment = /#[\w?\/:#]*/g;
  const reQuery = /\?.*/g; // remove fragment match before matching query
  const rePath = /\/(.)*/g; // remove query match before matching path

  const matchedFragment = didUrl.match(reFragment);
  const fragment = Array.isArray(matchedFragment) ? matchedFragment[0] : '';
  let didUrlCut = didUrl.replace(fragment, '');

  const matchedQuery = didUrlCut.match(reQuery);
  const rawQuery = Array.isArray(matchedQuery) ? matchedQuery[0] : '';
  const query = queryStringToObject(rawQuery);
  didUrlCut = didUrlCut.replace(rawQuery, '');

  const matchedPath = didUrlCut.match(rePath);
  const rawPath = Array.isArray(matchedPath) ? matchedPath[0] : '';
  const urlPath = rawPath.split('/');
  urlPath.shift();
  didUrlCut = didUrlCut.replace(rawPath, '');

  const methodInfo = didUrlCut.split(':');
  const methodName = methodInfo[1];

  return {
    methodName,
    methodSpecificId: methodInfo.slice(2).join(':'),
    urlPath,
    query,
    fragment,
  };
};
