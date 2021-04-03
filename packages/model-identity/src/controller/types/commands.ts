export interface ControllerCommands {
  Create: {
    id: string;
    payload: {
      did: string;
    };
  };
  AddDid: {
    id: string;
    payload: {
      did: string;
    };
  };
  RemoveDid: {
    id: string;
    payload: {
      did: string;
    };
  };
}
