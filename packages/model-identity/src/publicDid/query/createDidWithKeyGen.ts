export const CREATE_DIDDOC_WITH_KEYGEN = `
  mutation CreateDidDocWithKeyGen
   {
    createDidDocWithKeyGen
     {
      did
      publicKeyHex
      privateKey
      commit
    }
  }
`;
