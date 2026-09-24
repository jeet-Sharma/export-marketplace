import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { buildDataSourceOptions, type DbConfig } from '../../config/db.config.js';

/**
 * Global TypeORM module. Reads database settings from the "db" config
 * namespace (see src/config/db.config.ts) and registers a single shared
 * DataSource for the whole application.
 *
 * Domain modules add their entities via TypeOrmModule.forFeature([...])
 * inside their own module files — nothing is registered here directly.
 * Entities and migrations are picked up through the glob patterns in
 * buildDataSourceOptions once domain modules start adding them.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // AppConfigModule is global so ConfigService is already available here.
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const cfg = configService.get<DbConfig>('db')!;
        return buildDataSourceOptions(cfg);
      },
    }),
  ],
})
export class DatabaseModule {}
