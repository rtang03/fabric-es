import { AuthenticationError } from 'apollo-server-errors';
import { randomBytes } from 'crypto';
import { omit } from 'lodash';
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
  /**
   *   Do not require authentication
   */
  @Query(() => String)
  helloClient() {
    return 'hi! developer';
  }

  @Query(() => String, {
    nullable: true,
    description: 'client_id of root app; no authentication required'
  })
  async getRootClientId() {
    return Client.findOne({ applicationName: 'root' }).then(({ id }) => id);
  }

  @Query(() => [Client], {
    nullable: true,
    description: 'Public list of client apps; no authentication required'
  })
  async getPublicClients() {
    return Client.find().then(clients =>
      clients.map(item => omit(item, 'client_secret'))
    );
  }

  /**
   * used by app owner
   */
  @Query(() => [Client], {
    nullable: true,
    description: 'List of client apps owned by me; authentication required'
  })
  async getClients(@Ctx() { payload }: MyContext) {
    const user_id = payload?.userId;
    if (!user_id) throw new AuthenticationError('could not find user');

    return Client.find({ user_id });
  }

  @Mutation(() => CreateAppResponse, {
    nullable: true,
    description:
      'Create regular client app with all grant types; authentication required'
  })
  async createRegularApp(
    @Ctx() { payload }: MyContext,
    @Arg('applicationName') applicationName: string,
    @Arg('grants', () => [String])
    grants: string[],
    @Arg('redirect_uri', { nullable: true }) redirect_uri?: string
  ): Promise<CreateAppResponse> {
    const user_id = payload?.userId;
    const client_secret = generateSecret(8);

    if (!user_id) throw new AuthenticationError('could not find user');

    return Client.insert({
      applicationName,
      client_secret,
      grants,
      redirect_uris: redirect_uri ? [redirect_uri] : [],
      user_id,
      is_system_app: false
    })
      .then<CreateAppResponse>(({ identifiers }) => ({
        ok: true,
        client_id: identifiers[0].id,
        client_secret,
        applicationName,
        redirect_uri
        // is_system_app: false
      }))
      .catch(error => {
        console.error(error);
        return null;
      });
  }

  /**
   * used by OAuth Root Admin
   */
  @Query(() => [Client], {
    nullable: true,
    description: 'List of all client apps; administrator required'
  })
  @UseMiddleware(isAdmin)
  async getAllClients() {
    return Client.find();
  }

  // create system application
  @Mutation(() => CreateAppResponse, {
    nullable: true,
    description: 'Create system application; administrator required'
  })
  @UseMiddleware(isAdmin)
  async createApplication(
    @Ctx() { payload }: MyContext,
    @Arg('applicationName') applicationName: string,
    @Arg('grants', () => [String]) grants: string[],
    @Arg('redirect_uri', { nullable: true }) redirect_uri?: string
  ): Promise<CreateAppResponse> {
    const user_id = payload?.userId;
    const client_secret = generateSecret(8);

    return Client.insert({
      applicationName,
      client_secret,
      grants,
      redirect_uris: redirect_uri ? [redirect_uri] : [],
      user_id,
      is_system_app: true
    })
      .then<CreateAppResponse>(({ identifiers }) => ({
        ok: true,
        client_id: identifiers[0].id,
        client_secret,
        applicationName,
        redirect_uri,
        is_system_app: true
      }))
      .catch(error => {
        console.error(error);
        return null;
      });
  }

  // used by Oauth root admin, to create bootstrap admin user
  @Mutation(() => String, {
    nullable: true,
    description: 'Create root client application'
  })
  async createRootClient(
    @Arg('admin', { description: 'Input "admin"' }) admin: string,
    @Arg('password', { description: 'Input predefined password of root admin' })
    password: string
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
          // redirect_uris is not required
          redirect_uris: ['http://localhost:4000'],
          user_id: 'admin',
          is_system_app: true
        })
          .then(({ identifiers }) => identifiers[0].id)
          .catch(error => {
            console.error(error);
            return null;
          })
      : null;
  }
}
