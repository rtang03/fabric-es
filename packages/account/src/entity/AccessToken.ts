import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('access_tokens')
export class AccessToken extends BaseEntity {
  @PrimaryColumn('text')
  access_token: string;
  @Column('timestamp without time zone')
  expires_at: Date;
  @Column('text')
  client_id: string;
  @Column('text')
  user_id: string;
  @Column('text')
  scope: string;
}
