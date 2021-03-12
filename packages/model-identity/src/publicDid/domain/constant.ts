export const ID_CHAR = '[a-zA-Z0-9_.-]';
export const METHOD = '([a-zA-Z0-9_]+)';
export const METHOD_ID = `(${ID_CHAR}+(:${ID_CHAR}+)*)`;
export const PARAM_CHAR = '[a-zA-Z0-9_.:%-]';
export const PARAM = `;${PARAM_CHAR}+=${PARAM_CHAR}*`;
export const PARAMS = `((${PARAM})*)`;
export const PATH = `(\/[^#?]*)?`;
export const QUERY = `([?][^#]*)?`;
export const FRAGMENT = `(\#.*)?`;
export const DID_MATCHER = new RegExp(
  `^did:${METHOD}:${METHOD_ID}${PARAMS}${PATH}${QUERY}${FRAGMENT}$`
);
export const DID_PREFIX = 'did:fab';
