import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('api_key')
export class ApiKey extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  api_key: string;

  @Column('text')
  client_id: string;

  @Column({ type: 'simple-array', nullable: true })
  scope: string[];
}
