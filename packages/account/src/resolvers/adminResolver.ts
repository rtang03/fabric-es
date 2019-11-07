import { identityService } from '@espresso/admin-tool';
import {
  Arg,
  Ctx,
  Field,
  Int,
  ObjectType,
  Query,
  Resolver
} from 'type-graphql';
import { MyContext } from '../types';

@ObjectType()
export class Attribute {
  @Field()
  name: string;
  @Field()
  value: string;
}

@ObjectType()
export class Identity {
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
export class AdminResolver {
  @Query(() => [Identity], { nullable: true })
  async getAllIdentity(@Ctx() { fabricConfig }: MyContext) {
    const { result, errors, success } = await identityService(
      fabricConfig
    ).then(({ getAll }) => getAll());
    if (errors.length) {
      console.error(errors);
    }
    return success ? result.identities : null;
  }

  @Query(() => Identity, { nullable: true })
  async getIdentityByEnrollmentId(
    @Arg('enrollmentId') enrollmentId: string,
    @Ctx() { fabricConfig }: MyContext
  ) {
    const { result, errors, success } = await identityService(
      fabricConfig
    ).then(({ getOne }) => getOne(enrollmentId));
    if (errors.length) {
      console.error(errors);
    }
    return success ? result : null;
  }
}
