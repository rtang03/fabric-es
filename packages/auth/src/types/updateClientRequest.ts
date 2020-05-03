export interface UpdateClientRequest {
  application_name: string;
  client_secret: string;
  redirect_uris?: string;
  grants?: string[];
}
