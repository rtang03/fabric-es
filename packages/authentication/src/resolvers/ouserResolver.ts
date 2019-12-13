import {
  ApolloError,
  AuthenticationError,
  UserInputError,
  ValidationError
} from 'apollo-server';
import { compare, hash } from 'bcrypt';
import { omit } from 'lodash';
import { Request, Response, Token } from 'oauth2-server-typescript';
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
import { OUser } from '../entity/OUser';
import {
  ADMIN_PASSWORD_MISMATCH,
  ALREADY_EXIST,
  AUTH_HEADER_ERROR,
  BAD_PASSWORD,
  MyContext,
  ROOT_CLIENT_NOT_FOUND,
  USER_NOT_FOUND
} from '../types';
import { isAdmin, sendToken } from '../utils';

@ObjectType()
class LoginResponse {
  @Field()
  ok: boolean;
  @Field()
  accessToken: string;
  @Field(() => OUser)
  user?: Partial<OUser>;
}

@Resolver()
export class OUserResolver {
  @Query(() => String)
  hello() {
    return 'hi!';
  }

  @Query(() => [OUser], {
    description: 'List of all users; administrator required'
  })
  @UseMiddleware(isAdmin)
  async users() {
    return OUser.find();
  }

  @Query(() => OUser, {
    nullable: true,
    description: 'User profile; authentication required'
  })
  async me(@Ctx() { payload }: MyContext): Promise<Partial<OUser>> {
    const id = payload?.userId;
    if (!id) return null;

    return OUser.findOne({ id })
      .then(u => omit(u, 'password'))
      .catch(err => {
        console.error(err);
        throw new ApolloError(err.message);
      });
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { res, req, oauth2Server, oauthOptions }: MyContext
  ): Promise<LoginResponse> {
    const user = await OUser.findOne({ email });
    if (!user) throw new AuthenticationError('could not find user');

    if (!password) throw new UserInputError(BAD_PASSWORD);

    const valid = await compare(password, user.password);
    if (!valid) throw new ValidationError(BAD_PASSWORD);

    const client = await Client.findOne({ applicationName: 'root' });
    if (!client) throw new ValidationError(ROOT_CLIENT_NOT_FOUND);

    req.body.grant_type = 'password';
    req.body.username = user.username;
    req.body.password = password;
    req.body.scope = 'default';
    req.body.client_id = client.id;
    req.headers['content-type'] = 'application/x-www-form-urlencoded';

    return oauth2Server
      .token(new Request(req), new Response(res), oauthOptions)
      .then(({ accessToken, refreshToken }: Token) => {
        sendToken(res, accessToken);
        return {
          ok: true,
          accessToken,
          user: omit(user, 'password')
        };
      })
      .catch(error => {
        throw new AuthenticationError(error);
      });
  }

  @Query(() => Boolean, {
    description: 'Verify user and password; no authentication required'
  })
  async verifyPassword(
    @Arg('user_id') user_id: string,
    @Arg('password') password: string
  ): Promise<boolean> {
    const user = await OUser.findOne({ id: user_id });
    if (!user) throw new AuthenticationError(USER_NOT_FOUND);

    if (!password) throw new UserInputError(BAD_PASSWORD);

    return compare(password, user.password);
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('username') username: string,
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Arg('admin_password', {
      nullable: true,
      description: 'if provided, it registers as administrator'
    })
    adminPassword?: string
  ) {
    const usernameExist = await OUser.findOne({ username });
    if (usernameExist) throw new UserInputError(ALREADY_EXIST);

    const emailExist = await OUser.findOne({ email });
    if (emailExist) throw new UserInputError(ALREADY_EXIST);

    const validAdminPassword = adminPassword === process.env.ADMIN_PASSWORD;
    if (adminPassword && !validAdminPassword)
      throw new ValidationError(ADMIN_PASSWORD_MISMATCH);

    const hashedPassword = await hash(password, 12);

    return OUser.insert({
      username,
      email,
      password: hashedPassword,
      is_admin: adminPassword === process.env.ADMIN_PASSWORD
    })
      .then(() => true)
      .catch(error => {
        console.error(error);
        throw new ApolloError(error.message);
      });
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendToken(res, '');
    return true;
  }

  @Mutation(() => Boolean, { description: 'authentication required' })
  async updateUser(
    @Ctx() { payload }: MyContext,
    @Arg('email', { nullable: true }) email?: string,
    @Arg('username', { nullable: true }) username?: string
  ): Promise<boolean> {
    const id = payload?.userId;
    if (!id) throw new AuthenticationError(AUTH_HEADER_ERROR);

    const user = await OUser.findOne({ id }).catch(() => {
      throw new ValidationError(USER_NOT_FOUND);
    });
    if (!user) throw new ValidationError(USER_NOT_FOUND);

    if (email) user.email = email;

    if (username) user.username = username;

    return email || username
      ? OUser.save(user)
          .then(() => true)
          .catch(error => {
            console.error(error);
            throw new ApolloError(error.message);
          })
      : false;
  }

  // Todo: Re-think if it should allow physical removal of OUser entity, or set is_deleted boolean flag
  // @Mutation(() => Boolean)
  // async deleteUser(
  //   @Ctx() { payload }: MyContext,
  //   @Arg('user_id') user_id: string
  // ): Promise<boolean> {
  //   const id = payload?.userId;
  //   if (!id) throw new AuthenticationError(AUTH_HEADER_ERROR);
  //
  //   return OUser.delete(id)
  //     .then(() => true)
  //     .catch(error => {
  //       console.error(error);
  //       throw new ApolloError(error.message);
  //     });
  // }

  // Currently refreshToken is disabled
  // @Mutation(() => Boolean)
  // @UseMiddleware(isAdmin)
  // async revokeRefreshTokensForUser(@Arg('email') email: string) {
  //   return true;
  // }
}
