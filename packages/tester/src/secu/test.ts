import crypto from 'crypto';
import EC from 'elliptic';

export const createKeyPair = () => {
  const ec = new EC.ec('secp256k1');
  const key = ec.genKeyPair();
  const publicKey = key.getPublic('hex');
  const privateKey = key.getPrivate('hex');

  // const pubKey = ec.keyFromPublic(key.getPublic('hex'), 'hex');
  // const x = pubp.getX();
  // const y = pubp.getY();
  console.log('PRV', privateKey);
  console.log('PUB', publicKey);
};

// crypto.createHash('sha256').update(pwd).digest('hex');
void (() => {
  // createKeyPair();
  const prvPt1 = 'd7952b1d6640fdd43e4acddb3bc1352cbc187bcae8734924c7d22cf358b35f79';
  const pubPt1 = '0409cb713b14a9da647c0c2a19efc0c1a7daa5e37f5e6e64d3409d4934e899f4cc3c1f8f98b9705d1a7165efa6396b9bb7ac9dbea11b73d70b959a2ca7a5230086';

  const prvPt2 = '189a20e46c11f3d802124f668c8dce0b9ec42c0ff0f848add64a7078464f892a';
  const pubPt2 = '0468ea4c423893052b37d0174916970f64a6b6add3f6a770db6675a0d62cbff525954c8b70f4784da08bc16ffda0c45bc235a08a086195cdae1da2fadf915499c7';

  const ec = new EC.ec('secp256k1');

  const prvKey1 = ec.keyFromPrivate(prvPt1, 'hex');
  const pubKey1 = ec.keyFromPublic(pubPt1, 'hex');

  const prvKey2 = ec.keyFromPrivate(prvPt2, 'hex');
  const pubKey2 = ec.keyFromPublic(pubPt2, 'hex');

  const msgHash = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
  const sign1 = prvKey1.sign(msgHash);
  const sign2 = prvKey2.sign(msgHash);

  console.log('.1_1', pubKey1.verify(msgHash, sign1));
  console.log('.1_2', pubKey1.verify(msgHash, sign2));
  console.log('.2_1', pubKey2.verify(msgHash, sign1));
  console.log('.2_2', pubKey2.verify(msgHash, sign2));
})();
