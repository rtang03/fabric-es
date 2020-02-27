import { randomBytes } from 'crypto';
import util from 'util';
import { ApolloError, AuthenticationError, UserInputError, ValidationError } from 'apollo-server-express';
import omit from 'lodash/omit';
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from 'type-graphql';
import { Logger } from 'winston';
import { Client } from '../entity/Client';
import { ADMIN_PASSWORD_MISMATCH, ALREADY_EXIST, AUTH_HEADER_ERROR, CLIENT_NOT_FOUND, MyContext } from '../types';
import { getLogger, isAdmin } from '../utils';

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
  logger: Logger;

  constructor() {
    this.logger = getLogger({ name: 'ClientResolver.js' });
  }

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
    this.logger.info('getRootClientId');

    return Client.findOne({ applicationName: 'root' })
      .then(res => res?.id)
      .catch(error => {
        this.logger.warn(util.format('getRootClientId: %j', error));
        return new ApolloError(error);
      });
  }

  @Query(() => [Client], {
    nullable: true,
    description: 'Public list of client apps; no authentication required'
  })
  async getPublicClients() {
    this.logger.info('getPublicClients');

    return Client.find()
      .then(clients => clients.map(item => omit(item, 'client_secret')))
      .catch(error => {
        this.logger.warn(util.format('getPublicClients: %s', error.message));
        return new ApolloError(error);
      });
  }

  /**
   * used by app owner
   */
  @Query(() => [Client], {
    nullable: true,
    description: 'List of client apps owned by me; authentication required'
  })
  async getClients(@Ctx() { payload }: MyContext) {
    this.logger.info('getClients');
    const user_id = payload?.userId;
    if (!user_id) throw new AuthenticationError(AUTH_HEADER_ERROR);

    return Client.find({ user_id }).catch(error => {
      this.logger.warn(util.format('getClients: %s', error.message));
      return new ApolloError(error);
    });
  }

  @Mutation(() => CreateAppResponse, {
    nullable: true,
    description: 'Create regular client app with all grant types; authentication required'
  })
  async createRegularApp(
    @Ctx() { payload }: MyContext,
    @Arg('applicationName') applicationName: string,
    @Arg('grants', () => [String])
    grants: string[],
    @Arg('redirect_uri', { nullable: true }) redirect_uri?: string
  ): Promise<CreateAppResponse | ApolloError> {
    const user_id = payload?.userId;
    if (!user_id) {
      this.logger.info('createRegularApp: ' + AUTH_HEADER_ERROR);
      throw new AuthenticationError(AUTH_HEADER_ERROR);
    }

    const client_secret = generateSecret(8);

    return Client.insert({
      applicationName,
      client_secret,
      grants,
      redirect_uris: redirect_uri ? [redirect_uri] : [],
      user_id,
      is_system_app: false
    })
      .then<CreateAppResponse>(({ identifiers }) => {
        this.logger.info(util.format('createRegularApp: %s, %s', identifiers[0].id, applicationName));

        return {
          ok: true,
          client_id: identifiers[0].id,
          client_secret,
          applicationName,
          redirect_uri
          // is_system_app: false
        };
      })
      .catch(error => {
        this.logger.warn(util.format('getClients: %s', error.message));
        return new ApolloError(error);
      });
  }

  @Mutation(() => Boolean)
  async updateRegularApp(
    @Ctx() { payload }: MyContext,
    @Arg('client_id') client_id: string,
    @Arg('applicationName', { nullable: true }) applicationName?: string,
    @Arg('redirect_uri', { nullable: true }) redirect_uri?: string
  ): Promise<boolean | ApolloError> {
    this.logger.info('updateRegularApp');
    const id = payload?.userId;

    if (!id) {
      this.logger.warn(AUTH_HEADER_ERROR);
      throw new AuthenticationError(AUTH_HEADER_ERROR);
    }

    const client = await Client.findOne({ id: client_id }).catch(() => {
      this.logger.warn(CLIENT_NOT_FOUND);
      throw new UserInputError(CLIENT_NOT_FOUND);
    });

    if (applicationName) client.applicationName = applicationName;

    if (redirect_uri) client.redirect_uris = [redirect_uri];

    return applicationName || redirect_uri
      ? Client.save(client)
          .then(() => true)
          .catch(error => {
            this.logger.warn(util.format('updateRegularApp: %s', error.message));
            return new ApolloError(error);
          })
      : false;
  }

  @Mutation(() => Boolean)
  async deleteRegularApp(
    @Ctx() { payload }: MyContext,
    @Arg('client_id') client_id: string
  ): Promise<boolean | ApolloError> {
    this.logger.info('deleteRegularApp');
    const id = payload?.userId;

    if (!id) {
      this.logger.warn(AUTH_HEADER_ERROR);
      throw new AuthenticationError(AUTH_HEADER_ERROR);
    }

    const client = await Client.findOne({ id: client_id }).catch(() => {
      this.logger.warn(CLIENT_NOT_FOUND);
      throw new UserInputError(CLIENT_NOT_FOUND);
    });

    return client
      ? Client.delete(client_id)
          .then(() => true)
          .catch(error => {
            this.logger.warn(util.format('deleteRegularApp: %s', error.message));
            return new ApolloError(error);
          })
      : false;
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
    this.logger.info('getAllClients');

    return Client.find().catch(error => {
      this.logger.warn(util.format('getAllClients: %s', error.message));
      return new ApolloError(error);
    });
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
  ): Promise<CreateAppResponse | ApolloError> {
    this.logger.info('createApplication');
    const user_id = payload?.userId;

    if (!user_id) {
      this.logger.warn(AUTH_HEADER_ERROR);
      throw new AuthenticationError(AUTH_HEADER_ERROR);
    }

    const client_secret = generateSecret(8);

    return Client.insert({
      applicationName,
      client_secret,
      grants,
      redirect_uris: redirect_uri ? [redirect_uri] : [],
      user_id,
      is_system_app: true
    })
      .then<CreateAppResponse>(({ identifiers }) => {
        this.logger.info(util.format('createApplication: %s, %s', identifiers[0].id, applicationName));

        return {
          ok: true,
          client_id: identifiers[0].id,
          client_secret,
          applicationName,
          redirect_uri,
          is_system_app: true
        };
      })
      .catch(error => {
        this.logger.warn(util.format('createApplication: %s', error.message));
        return new ApolloError(error);
      });
  }

  // todo: update/delete system app

  // used by Oauth root admin, to create bootstrap admin user
  @Mutation(() => String, {
    nullable: true,
    description: 'Create root client application'
  })
  async createRootClient(
    @Arg('admin', { description: 'Input "admin"' }) admin: string,
    @Arg('password', { description: 'Input predefined password of root admin' })
    password: string,
    @Ctx() { rootAdmin, rootAdminPassword }: MyContext
  ) {
    const root = await Client.findOne({ applicationName: 'root' });

    if (root) {
      this.logger.warn(`createRootClient ${ALREADY_EXIST}`);
      return new ValidationError(ALREADY_EXIST);
    }

    if (admin === rootAdmin && password === rootAdminPassword)
      return Client.insert({
        applicationName: 'root',
        client_secret: rootAdminPassword,
        grants: ['password', 'authorization_code', 'refresh_token', 'client_credentials', 'implicit'],
        // redirect_uris is not required
        redirect_uris: ['http://localhost:4000'],
        user_id: rootAdmin,
        is_system_app: true
      })
        .then(result => {
          const id = result.identifiers[0].id;
          this.logger.info(util.format('createRootClient: %s', id));
          return id;
        })
        .catch(error => {
          this.logger.warn(util.format('createRootClient: %s', error.message));
          return new ApolloError(error);
        });
    else return new ValidationError(ADMIN_PASSWORD_MISMATCH);
  }
}
