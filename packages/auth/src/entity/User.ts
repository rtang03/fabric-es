import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  email: string;

  @Column({ type: 'text', nullable: true })
  username: string;

  @Column('text')
  password: string;

  @Column()
  is_admin: boolean;

  @Column({ type: 'boolean', nullable: true })
  is_deleted: boolean;
}
