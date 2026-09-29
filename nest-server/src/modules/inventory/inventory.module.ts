import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntity } from './entities/inventory.entity.js';
import { StockReservationEntity } from './entities/stock-reservation.entity.js';
import { StockMovementEntity } from './entities/stock-movement.entity.js';
import { StockAlertEntity } from './entities/stock-alert.entity.js';

/**
 * PART 4 — Inventory (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Registers the 4 inventory entities as TypeORM entities: inventory,
 * stock_reservation, stock_movement, stock_alert.
 *
 * No controller or service yet — this is a database-schema-only pass (see
 * the CreateInventory migration for the actual schema). No atomic
 * reserve/release statements, no reservation-expiry sweeper job, and no
 * low-stock scan job are implemented here.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryEntity, StockReservationEntity, StockMovementEntity, StockAlertEntity]),
  ],
  exports: [TypeOrmModule],
})
export class InventoryModule {}
