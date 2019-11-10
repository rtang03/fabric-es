import { BaseEntity, Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('oauth_clients')
export class Client extends BaseEntity {
  @PrimaryColumn('text')
  id: string;

  @PrimaryColumn('text')
  client_id: string;

  @PrimaryColumn('text')
  client_secret: string;

  @Column('simple-array')
  redirect_uris: string[];

  @Column('simple-array')
  grants: string[];

  @Column('text')
  user_id: string;
}
