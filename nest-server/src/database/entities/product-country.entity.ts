import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Country } from './country.entity.js';
import { Product } from './product.entity.js';

// Maps a product to the countries/markets in which it is available or
// targeted. This represents availability/target markets only — source/
// origin remains products.sourceCountry.
@Entity('product_countries')
@Index(['countryId', 'productId'])
export class ProductCountry {
  @PrimaryColumn({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @PrimaryColumn({ type: 'uuid', name: 'country_id' })
  countryId!: string;

  @ManyToOne(() => Country, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'country_id' })
  country!: Country;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
