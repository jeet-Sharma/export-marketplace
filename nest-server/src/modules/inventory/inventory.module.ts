import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntity } from './entities/inventory.entity.js';
import { StockReservationEntity } from './entities/stock-reservation.entity.js';
import { StockMovementEntity } from './entities/stock-movement.entity.js';
import { StockAlertEntity } from './entities/stock-alert.entity.js';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';
import { StockMovementsService } from './stock-movements.service.js';
import { StockAlertsService } from './stock-alerts.service.js';

/**
 * PART 4 — Inventory (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Registers the 4 inventory entities as TypeORM entities: inventory,
 * stock_reservation, stock_movement, stock_alert — plus InventoryService
 * (reserve/release/convert/consume, kept internal — see its class
 * comment) and the read-only/manual-adjustment REST surface
 * (InventoryController) backed by StockMovementsService and
 * StockAlertsService.
 *
 * InventoryService is exported (not just TypeOrmModule) so a future
 * Checkout/Order module (Part 7, not built yet) can import this module
 * and call reserveStock/convertReservation/consumeReservation/
 * releaseReservation directly, without those methods ever being routed
 * as public HTTP endpoints.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryEntity, StockReservationEntity, StockMovementEntity, StockAlertEntity]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, StockMovementsService, StockAlertsService],
  exports: [TypeOrmModule, InventoryService],
})
export class InventoryModule {}
