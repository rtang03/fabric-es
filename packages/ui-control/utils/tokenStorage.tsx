export let inMemoryToken: string | null;

export const saveToken: (access_token?: string | null) => void = (access_token) => {
  inMemoryToken = access_token || null;
};

export const getToken = () => inMemoryToken;
