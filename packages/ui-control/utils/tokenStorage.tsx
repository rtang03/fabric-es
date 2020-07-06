export let inMemoryToken: string | null;
export let inMemoryTokExpInSec: number | null | undefined;

export const saveToken: (access_token?: string | null, expiryInSec?: number | null) => void = (
  access_token,
  expiryInSec
) => {
  inMemoryToken = access_token || null;
  inMemoryTokExpInSec = expiryInSec;
};

export const getToken = () => inMemoryToken;
