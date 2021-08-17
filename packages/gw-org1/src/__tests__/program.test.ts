import https from 'https';
import { getHttpsServerOption, httpsify } from '@fabric-es/gateway-lib';

const certPathOk = '/Users/paul/cert/local/org1.crt';
const keyPathOk = '/Users/paul/cert/local/org3.key';
const certPathNx = '/Users/paul/cert/local/org4.crt';
const keyPathNx = '/Users/paul/cert/local/org4.key';
const certPathUd = undefined;
const keyPathUd = undefined;

const timestamp = Date.now();

afterAll(async () => {
  // await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('Utils unit tests finished', timestamp);
});

describe('Utils Unit Test', () => {
  it('test getHttpsServerOption - https', async () => {
    const { key, cert, ...rest } = await getHttpsServerOption({
      certPath: certPathOk,
      certKeyPath: keyPathOk,
    }) as https.ServerOptions;

    expect(key).toBeDefined();
    expect(cert).toBeDefined();
    expect(rest).toEqual({});
  });

  it('test getHttpsServerOption - https mock', async () => {
    expect(await getHttpsServerOption({
      certPath: certPathOk,
      certKeyPath: keyPathOk,
      mock: true,
    })).toEqual({});
  });

  it('test getHttpsServerOption - undefined paths 1', async () => {
    expect(await getHttpsServerOption({
      certPath: certPathUd,
      certKeyPath: keyPathOk,
    })).toBeUndefined();
  });

  it('test getHttpsServerOption - undefined paths 2', async () => {
    expect(await getHttpsServerOption({
      certPath: certPathOk,
      certKeyPath: keyPathUd,
    })).toBeUndefined();
  });

  it('test getHttpsServerOption - cert not exists', async () => {
    expect(await getHttpsServerOption({
      certPath: certPathNx,
      certKeyPath: keyPathOk,
    })).toBeUndefined();
  });

  it('test getHttpsServerOption - key not exists', async () => {
    expect(await getHttpsServerOption({
      certPath: certPathOk,
      certKeyPath: keyPathNx,
    })).toBeUndefined();
  });

  it('test getHttpsServerOption - not https, mock', async () => {
    expect(await getHttpsServerOption({
      certPath: certPathOk,
      certKeyPath: keyPathNx,
      mock: true,
    })).toBeUndefined();
  });

  it('test getHttpsServerOption - options 1', async () => {
    const { key, cert, ...rest } = await getHttpsServerOption({
      certPath: certPathOk,
      certKeyPath: keyPathOk,
      options: { handshakeTimeout: 1001 },
    }) as https.ServerOptions;
    expect(rest).toEqual({ handshakeTimeout: 1001 });
  });

  it('test getHttpsServerOption - options 2', async () => {
    expect(await getHttpsServerOption({
      certPath: certPathNx,
      certKeyPath: keyPathOk,
      options: { handshakeTimeout: 1002 },
    })).toEqual({ handshakeTimeout: 1002 });
  });

  it('test httpsify - replace', () => {
    expect(httpsify('http://www.cdi.network/hello/how/are/you').startsWith('https://')).toBeTruthy();
  });

  it('test httpsify - add', () => {
    expect(httpsify('www.cdi.network/hello/how/are/you').startsWith('https://')).toBeTruthy();
  });

  it('test httpsify - noop', () => {
    expect(httpsify('https://www.cdi.network/hello/how/are/you').startsWith('https://')).toBeTruthy();
  });

  it('test httpsify - unsupported', () => {
    expect(() => httpsify('ftp://www.cdi.network/hello/how/are/you')).toThrow('Invalid URI: ftp://www.cdi.network/hello/how/are/you');
  });
});