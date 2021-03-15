export const CREATE_DIDDOC_WITH_KEYGEN = `
  mutation CreateDidDocWithKeyGenPrivate
   {
    createDidDocWithKeyGenPrivate
     {
      did
      publicKeyHex
      privateKey
      commit
    }
  }
`;
