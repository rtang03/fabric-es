export let inMemoryToken: string | null;
export let inMemoryTokExpInSec: number | null | undefined;

// const saveToken: (access_token?: string | null, expiryInSec?: number | null) => void = (
//   access_token,
//   expiryInSec
// ) => {
//   if (typeof window === 'object') {
//     inMemoryToken = access_token || null;
//     inMemoryTokExpInSec = expiryInSec;
//   }
// };
//
// const getToken = () => inMemoryToken;

export const tokenStore = {
  saveToken: (access_token: string | null | undefined, expiryInSec?: number) => {
    if (typeof window === 'object') {
      inMemoryToken = access_token || null;
      inMemoryTokExpInSec = expiryInSec;
    }
  },
  getToken: () => inMemoryToken,
};
