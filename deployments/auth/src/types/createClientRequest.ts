export interface CreateClientRequest {
  application_name: string;
  client_secret: string;
  grants?: string[];
  redirect_uris?: string;
  user_id: string;
  is_system_app?: boolean;
}
