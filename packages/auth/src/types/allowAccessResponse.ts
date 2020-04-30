export interface AllowAccessResponse {
  ok: boolean;
  allow: boolean;
  client_id: string;
  scope: string[];
}
