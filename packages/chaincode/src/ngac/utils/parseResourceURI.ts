import { includes } from 'lodash';

const splitKey = (key: string) => key.split('/');
const label = ['model', 'organization', 'entity', 'entityid'];

export const parseResourceURI = (uri: string) => {
  const result = {};
  splitKey(uri).forEach((part, index) => {
    if (part === '*') {
      result[label[index]] = label[index];
    } else if (part.includes('?')) {
      const subparts = part.split('?');
      const attributes = subparts[1].split(',');
      const attributeJSON = {};
      attributes.forEach(attribute => {
        const subsubparts = attribute.split('=');
        attributeJSON[subsubparts[0]] = subsubparts[1];
      });
      if (!includes(label, subparts[0])) {
        throw new Error('Incorrect ResourceURI');
      }
      result[subparts[0]] = attributeJSON;
    } else {
      result[label[index]] = part;
    }
  });
  return result;
};
