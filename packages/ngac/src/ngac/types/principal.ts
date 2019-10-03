export interface Principal {
  [key: string]: string;
}

const getUser = (userName: string, users: Principal[]): Principal => {
  return users[0];
};
