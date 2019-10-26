export interface PublicCommands {
  CreateEtcPo: {
    userId: string;
    payload: { id: string; body: string; timestamp: number };
  };
  UpdateBody: {
    userId: string;
    payload: { id: string; body: string; timestamp: number };
  };
}
