import {
  AuthenticationError,
  ForbiddenError,
  UserInputError
} from 'apollo-server';
import { compare, hash } from 'bcrypt';
import { pick } from 'lodash';
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
import { MyContext } from '../types';
import { isAdmin, sendRefreshToken } from '../utils';

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

  @Query(() => [OUser])
  @UseMiddleware(isAdmin)
  async users() {
    return OUser.find();
  }

  @Query(() => OUser, { nullable: true })
  async me(@Ctx() { payload }: MyContext): Promise<OUser> {
    const id = payload?.userId;
    return id
      ? await OUser.findOne({ id })
          .then(u => pick(u, 'id', 'email', 'username'))
          .catch(err => {
            console.error(err);
            return null;
          })
      : null;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { res, req, oauth2Server }: MyContext
  ): Promise<LoginResponse> {
    const user = await OUser.findOne({ email });
    if (!user) throw new AuthenticationError('could not find user');

    const valid = await compare(password, user.password);
    if (!valid) throw new UserInputError('bad password');

    const client = await Client.findOne({ applicationName: 'root' });
    if (!client) throw new Error('Root client not exist');

    req.body.grant_type = 'password';
    req.body.username = user.username;
    req.body.password = password;
    req.body.scope = 'default';
    req.body.client_id = client.id;
    req.headers['content-type'] = 'application/x-www-form-urlencoded';

    return oauth2Server
      .token(new Request(req), new Response(res), {
        requireClientAuthentication: { password: false, refresh_token: false }
      })
      .then(({ accessToken, refreshToken }: Token) => {
        sendRefreshToken(res, refreshToken);
        return {
          ok: true,
          accessToken,
          user: pick(user, 'email', 'username', 'id')
        };
      })
      .catch(error => {
        throw new AuthenticationError(error);
      });
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('username') username: string,
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Arg('admin_password', { nullable: true }) adminPassword?: string
  ) {
    const exist = await OUser.findOne({ email });
    const hashedPassword = await hash(password, 12);
    return exist
      ? false
      : OUser.insert({
          username,
          email,
          password: hashedPassword,
          isAdmin: adminPassword
            ? adminPassword === process.env.ADMIN_PASSWORD
            : false
        })
          .then(() => true)
          .catch(error => {
            console.error(error);
            return false;
          });
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, '');
    return true;
  }

  @Mutation(() => Boolean)
  async updateUser(
    @Ctx() { payload }: MyContext,
    @Arg('email') email?: string,
    @Arg('username') username?: string
  ) {
    const id = payload?.userId;
    const user = await OUser.findOne({ id });
    if (!user) return false;
    if (email) user.email = email;
    if (username) user.username = username;
    return email && username
      ? await OUser.save(user)
          .then(() => true)
          .catch(error => {
            console.error(error);
            return false;
          })
      : false;
  }

  // todo: future use case
  // @Mutation(() => Boolean)
  // async removeUser() {
  //   return true;
  // }
  // @Mutation(() => Boolean)
  // @UseMiddleware(isAdmin)
  // async revokeRefreshTokensForUser(@Arg('email') email: string) {
  //   return true;
  // }
}