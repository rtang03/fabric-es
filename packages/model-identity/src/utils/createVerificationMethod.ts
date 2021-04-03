export const createVerificationMethod: (option: {
  id: string;
  controller: string;
  publicKeyHex: string;
}) => any = ({ id, controller, publicKeyHex }) => ({
  type: 'Secp256k1VerificationKey2018',
  id,
  controller,
  publicKeyHex,
});
