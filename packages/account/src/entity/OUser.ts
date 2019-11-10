import { User as IUser } from 'oauth2-server-typescript';
import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity('oauth_users')
export class OUser extends BaseEntity {
  @Field(() => String)
  @PrimaryGeneratedColumn()
  id: string;

  @Field()
  @Column('text')
  email: string;

  @Field()
  @Column('text')
  username: string;

  @Column('text')
  password: string;

  @Column('int', { default: 0 })
  tokenVersion: number;
}
