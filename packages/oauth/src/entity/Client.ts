import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity('oauth_clients')
export class Client extends BaseEntity {
  @Field(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('text')
  applicationName: string;

  @Field()
  @Column('text')
  client_secret: string;

  @Field(() => [String])
  @Column('simple-array')
  redirect_uris: string[];

  @Field(() => [String])
  @Column('simple-array')
  grants: string[];

  @Field()
  @Column({ type: 'text', nullable: true })
  user_id: string;

  @Field()
  @Column()
  is_system_app: boolean;
}
