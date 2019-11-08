import { createUser, identityService } from '@espresso/admin-tool';
import { AuthenticationError } from 'apollo-server';
import { compare, hash } from 'bcrypt';
import { verify } from 'jsonwebtoken';
import { assign, pick } from 'lodash';
import {
  Arg,
  Ctx,
  Field,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware
} from 'type-graphql';
import { getConnection } from 'typeorm';
import { User } from '../entity/User';
import { MyContext } from '../types';
import {
  createAccessToken,
  createRefreshToken,
  isAuth,
  sendRefreshToken
} from '../utils';
import { Attribute, Identity } from './adminResolver';

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
  @Field(() => User)
  user: User;
}

@ObjectType()
class UserProfile {
  @Field()
  email: string;
  @Field()
  id: string;
  @Field()
  type: string;
  @Field()
  affiliation: string;
  @Field(() => Int)
  max_enrollments: number;
  @Field(() => [Attribute])
  attrs: Attribute[];
  @Field()
  caname?: string;
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return 'hi!';
  }

  // option 1: authentication via using type-graphql middleware
  @Query(() => String)
  @UseMiddleware(isAuth)
  bye(@Ctx() { payload }: MyContext) {
    // console.log(payload);
    // { userId: 1, iat: 1572942436, exp: 1572943336 }
    return `your user id is: ${payload!.userId}`;
  }

  @Query(() => [User])
  users() {
    return User.find();
  }

  // option 2: authentication via context
  @Query(() => UserProfile, { nullable: true })
  async me(@Ctx() { payload, fabricConfig }: MyContext): Promise<UserProfile> {
    let user: Pick<User, 'email'>;
    let caIdentity: Identity;

    if (payload.userId) {
      try {
        // user profile database
        user = await User.findOne(payload.userId).then(u => pick(u, 'email'));

        // ca server
        const { result, success } = await identityService(fabricConfig).then(
          ({ getOne }) => getOne(user.email)
        );
        if (success) caIdentity = result;
        else return null;
      } catch (err) {
        console.log(err);
        return null;
      }
    } else throw new AuthenticationError(payload.error);

    return assign({}, user, caIdentity);
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, '');
    return true;
  }

  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(@Arg('userId', () => Int) userId: number) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, 'tokenVersion', 1);

    return true;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error('could not find user');
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      throw new Error('bad password');
    }

    sendRefreshToken(res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
      user
    };
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { fabricConfig }: MyContext
  ) {
    const exist = await User.findOne({ email });
    if (exist) return false;

    const hashedPassword = await hash(password, 12);

    try {
      await User.insert({
        email,
        password: hashedPassword
      });
    } catch (err) {
      console.error('Insert local database error.');
      console.error(err);
      return false;
    }

    try {
      await createUser(email, password, fabricConfig);
    } catch (err) {
      console.error('Create Fabric CA identity error.');
      console.error(err);
      await User.delete({ email });
      return false;
    }

    return true;
  }
}
