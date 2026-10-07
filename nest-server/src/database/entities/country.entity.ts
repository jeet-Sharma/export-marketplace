import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'char', length: 2, unique: true })
  iso2Code!: string;

  @Column({ type: 'char', length: 3, unique: true, nullable: true })
  iso3Code!: string | null;

  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Column({ type: 'boolean' })
  isActive!: boolean;
}
