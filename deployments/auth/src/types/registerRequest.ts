export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  org_admin_secret?: string;
}
