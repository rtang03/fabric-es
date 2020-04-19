import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('access_tokens')
export class AccessToken extends BaseEntity {
  @PrimaryColumn('text')
  access_token: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  expires_at: Date;

  @Column({ type: 'text', nullable: true })
  client_id: string;

  @Column({ type: 'text', nullable: true })
  user_id: string;

  @Column({ type: 'text', nullable: true })
  scope: string;
}
