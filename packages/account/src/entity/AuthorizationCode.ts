import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('authorization_codes')
export class AuthorizationCode extends BaseEntity {
  @PrimaryColumn('text')
  authorization_code: string;
  @Column('timestamp without time zone')
  expires_at: Date;
  @Column('text')
  redirect_uri: string;
  @Column('text')
  scope: string;
  @Column('text')
  client_id: string;
  @Column('text')
  user_id: string;
}
