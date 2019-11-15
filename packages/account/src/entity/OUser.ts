import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity('oauth_users')
export class OUser extends BaseEntity {
  @Field(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('text')
  email: string;

  @Field()
  @Column({ type: 'text', nullable: true })
  username: string;

  @Column('text')
  password: string;
}
