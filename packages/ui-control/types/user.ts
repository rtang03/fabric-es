export interface User {
  id: string;
  username: string;
  // email?: string;
  is_deleted?: boolean;
  is_admin?: boolean;
  password?: string;
}
