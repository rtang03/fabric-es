import { randomBytes } from 'crypto';
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware
} from 'type-graphql';
import { Client } from '../entity/Client';
import { MyContext } from '../types';
import { isAdmin } from '../utils';

const generateSecret = len =>
  randomBytes(len)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

@Resolver()
export class ClientResolver {
  @Query(() => String)
  helloClient() {
    return 'hi! developer';
  }

  @Query(() => [Client])
  @UseMiddleware(isAdmin)
  async clients() {
    return Client.find();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAdmin)
  async createApplication(
    @Arg('applicationName') applicationName: string,
    @Arg('redirect_uris') uri: string,
    @Arg('grants', () => [String]) grants: string[],
    @Ctx() { payload }: MyContext
  ) {
    const user_id = payload?.userId;
    return Client.insert({
      applicationName,
      client_secret: generateSecret(8),
      grants,
      redirect_uris: [uri],
      user_id
    })
      .then(() => true)
      .catch(error => {
        console.error(error);
        return false;
      });
  }

  @Mutation(() => String)
  async createRootClient(
    @Arg('admin') admin: string,
    @Arg('password') password: string
  ) {
    const root = await Client.findOne({ applicationName: 'root' });
    if (root) throw new Error('Root client already exist');

    return admin === process.env.ADMIN &&
      password === process.env.ADMIN_PASSWORD
      ? Client.insert({
          applicationName: 'root',
          client_secret: 'secret',
          grants: [
            'password',
            'authorization_code',
            'refresh_token',
            'client_credentials',
            'implicit'
          ],
          redirect_uris: ['http://localhost:4000'],
          user_id: 'admin'
        })
          .then(({ identifiers }) => identifiers[0].id)
          .catch(error => {
            console.error(error);
            return null;
          })
      : null;
  }

  @Query(() => String)
  async getRootClientId() {
    return Client.findOne({ applicationName: 'root' }).then(({ id }) => id);
  }

}
