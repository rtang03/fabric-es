import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @PrimaryColumn('text')
  refresh_token: string;

  @Column('timestamp without time zone')
  expires_at: Date;

  @Column('text')
  client_id: string;

  @Column('text')
  user_id: string;

  @Column('text')
  scope: string;
}
