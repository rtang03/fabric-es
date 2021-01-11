import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('oauth_clients')
export class Client extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  application_name: string;

  @Column({ type: 'text' })
  client_secret: string;

  @Column({ type: 'text', nullable: true })
  redirect_uris: string;

  @Column({ type: 'simple-array', nullable: true })
  grants: string[];

  @Column({ type: 'text', nullable: true })
  user_id: string;

  @Column()
  is_system_app: boolean;
}
