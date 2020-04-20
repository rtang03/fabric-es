import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('access_tokens')
export class AccessToken extends BaseEntity {
  @PrimaryColumn('text')
  access_token: string;

  @Column({ type: 'bigint', nullable: true })
  expires_at: number;

  @Column({ type: 'text', nullable: true })
  client_id: string;

  @Column({ type: 'text', nullable: true })
  user_id: string;

  @Column({ type: 'text', nullable: true })
  scope: string;
}
