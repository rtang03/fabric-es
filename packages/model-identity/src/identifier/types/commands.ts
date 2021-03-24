export type IdentifierCommands = {
  Create: {
    id: string;
    payload: {
      type: string;
      ownerId: string;
      did: string;
      signedRequest: string;
    };
  };
  Activate: {
    id: string;
    payload: {
      did: string;
      signedRequest: string;
    };
  };
  Deactivate: {
    id: string;
    payload: {
      did: string;
      signedRequest: string;
    };
  };
  AddAttribute: {
    id: string;
    payload: {
      key: string;
      value: string;
      description?: string;
      did: string;
      signedRequest: string;
    };
  };
  RemoveAttribute: {
    id: string;
    payload: { key: string; did: string; signedRequest: string };
  };
};
