export interface User {
  id: string;
  username: string;
  is_deleted?: boolean;
  is_admin?: boolean;
  password?: string;
}
