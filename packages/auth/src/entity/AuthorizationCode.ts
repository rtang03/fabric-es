import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('authorization_codes')
export class AuthorizationCode extends BaseEntity {
  @PrimaryColumn('text')
  authorization_code: string;

  @Column({ type: 'bigint', nullable: true })
  expires_at: number;

  @Column('text')
  redirect_uri: string;

  @Column({ type: 'simple-array', nullable: true })
  scope: string[];

  @Column('text')
  client_id: string;

  @Column('text')
  user_id: string;

  @Column('text')
  username: string;
}
