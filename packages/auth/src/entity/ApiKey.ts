import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('api_key')
export class ApiKey extends BaseEntity {
  @PrimaryColumn('text')
  api_key: string;

  @Column('text')
  client_id: string;

  @Column({ type: 'simple-array', nullable: true })
  scope: string[];
}
