import type { Identifier, IdentifierEvents } from '../types';

export const identifierReducer: (identitifer: Identifier, event: IdentifierEvents) => Identifier = (
  identitifer,
  event
) => {
  switch (event.type) {
    case 'IdentifierCreated':
      return;
    default:
      return identitifer;
  }
};
