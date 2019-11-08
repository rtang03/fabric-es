import { createUser, identityService } from '@espresso/admin-tool';
import { compare, hash } from 'bcrypt';
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

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
  @Field(() => User)
  user?: User;
  @Field(() => UserProfile)
  userProfile?: UserProfile;
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

    // should change to optional chaining when prettier is fixed
    const userId = payload ? payload.userId : null;

    if (userId) {
      try {
        // user profile database
        user = await User.findOne(userId).then(u => pick(u, 'email'));
        // ca server
        const { result, success } = await identityService(fabricConfig).then(
          ({ getOne }) => getOne(user.email)
        );
        if (success) caIdentity = result;
        else return null;
      } catch (err) {
        console.error(err);
        return null;
      }
    } else return null;

    return assign({}, user, caIdentity);
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { res, fabricConfig }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('could not find user');
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      throw new Error('bad password');
    }

    const caIdentity: Identity = await identityService(fabricConfig)
      .then(({ getOne }) => getOne(user.email))
      .then(({ result, success }) => (success ? result : null));

    if (!caIdentity) throw new Error('could not find CA Identity');

    sendRefreshToken(res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
      user,
      userProfile: assign({}, user, caIdentity)
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
}
