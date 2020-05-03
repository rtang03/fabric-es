export interface Client {
  id: string;
  application_name: string;
  client_secret?: string;
  redirect_uris?: string;
  grants?: string[];
  user_id?: string;
  is_system_app?: boolean;
}
