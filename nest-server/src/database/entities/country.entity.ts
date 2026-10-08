import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'char', length: 2, name: 'iso2_code', unique: true })
  iso2Code!: string;

  @Column({
    type: 'char',
    length: 3,
    name: 'iso3_code',
    unique: true,
    nullable: true,
  })
  iso3Code!: string | null;

  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Column({ type: 'boolean', name: 'is_active' })
  isActive!: boolean;
}
