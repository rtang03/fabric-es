import { randomBytes } from 'crypto';
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
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

@ObjectType()
class CreateAppResponse {
  @Field()
  ok: boolean;
  @Field()
  client_id: string;
  @Field()
  applicationName: string;
  @Field()
  client_secret: string;
  @Field({ nullable: true })
  redirect_uri: string;
}

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

  @Mutation(() => CreateAppResponse)
  @UseMiddleware(isAdmin)
  async createApplication(
    @Ctx() { payload }: MyContext,
    @Arg('applicationName') applicationName: string,
    @Arg('grants', () => [String]) grants: string[],
    @Arg('redirect_uri', { nullable: true }) redirect_uri?: string
  ): Promise<CreateAppResponse> {
    const user_id = payload?.userId;
    const client_secret = generateSecret(8);
    return user_id
      ? Client.insert({
          applicationName,
          client_secret,
          grants,
          redirect_uris: redirect_uri ? [redirect_uri] : [],
          user_id
        })
          .then<CreateAppResponse>(({ identifiers }) => ({
            ok: true,
            client_id: identifiers[0].id,
            client_secret,
            applicationName,
            redirect_uri
          }))
          .catch(error => {
            console.error(error);
            return null;
          })
      : null;
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
