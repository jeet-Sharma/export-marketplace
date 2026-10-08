import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Country } from './country.entity.js';

@Entity('vendors')
@Index(['status', 'companyName'])
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 250, name: 'company_name' })
  companyName!: string;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'display_name',
    nullable: true,
  })
  displayName!: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  // Supplier home/registered country — TBD in the source doc, so nullable.
  @ManyToOne(() => Country, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'country_id' })
  country!: Country | null;

  @Column({ type: 'uuid', name: 'country_id', nullable: true })
  countryId!: string | null;

  // Suggested values: ACTIVE, INACTIVE.
  @Column({ type: 'varchar', length: 30 })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
