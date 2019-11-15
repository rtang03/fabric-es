import {
  AuthenticationError,
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
import { OUser } from '../entity/OUser';
import { MyContext } from '../types';
import { isAuth, sendRefreshToken } from '../utils';

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

  // option 1: authentication via using type-graphql middleware
  @Query(() => String)
  @UseMiddleware(isAuth)
  bye(@Ctx() { payload }: MyContext) {
    return `your user id is: ${payload!.userId}`;
  }

  // todo: it should be replaced with authenticated access
  @Query(() => [OUser])
  users() {
    return OUser.find();
  }

  // option 2: authentication via context
  @Query(() => OUser, { nullable: true })
  async me(@Ctx() { payload }: MyContext): Promise<OUser> {
    const userId = payload ? payload.userId : null;
    return userId
      ? await OUser.findOne(userId)
          .then(u => pick(u, 'email', 'username'))
          .catch(err => {
            console.error(err);
            return null;
          })
      : null;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('username') username: string,
    @Arg('password') password: string,
    @Ctx() { res, req, oauthServer }: MyContext
  ): Promise<LoginResponse> {
    const user = await OUser.findOne({ where: { username } });
    if (!user) throw new AuthenticationError('could not find user');

    req.body.grant_type = 'password';
    req.body.username = username;
    req.body.password = password;
    req.body.scope = 'default';

    const valid = await compare(password, user.password);
    if (!valid) throw new UserInputError('bad password');

    return oauthServer
      .token(new Request(req), new Response(res), {
        requireClientAuthentication: { password: false, refresh_token: false }
      })
      .then((token: Token) => {
        sendRefreshToken(res, token.refreshToken);
        return {
          ok: true,
          accessToken: token.refreshToken,
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
    @Arg('password') password: string
  ) {
    const exist = await OUser.findOne({ email });
    if (exist) return false;

    const hashedPassword = await hash(password, 12);
    try {
      await OUser.insert({
        username,
        email,
        password: hashedPassword
      });
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, '');
    return true;
  }

  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(@Arg('email') email: string) {
    // todo: to be implemented
    return true;
  }
}
