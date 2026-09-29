import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovementEntity } from './entities/stock-movement.entity.js';
import { InventoryEntity } from './entities/inventory.entity.js';

/**
 * Part 4.3 — stock_movement. Append-only: this service only reads
 * (CreateInventory1732800000004 grants no UPDATE/DELETE at the DB role
 * level). Writes happen exclusively inside InventoryService's transactions.
 */
@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovementEntity)
    private readonly movementRepository: Repository<StockMovementEntity>,
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepository: Repository<InventoryEntity>,
  ) {}

  /** Audit trail for one product, newest first — matches the movement_by_product index (product_id, created_at DESC). */
  async findAllForProduct(productId: string, organizationId: string): Promise<StockMovementEntity[]> {
    const exists = await this.inventoryRepository.exists({ where: { productId, organizationId } });
    if (!exists) {
      throw new NotFoundException(`Inventory for product ${productId} not found`);
    }

    return this.movementRepository.find({
      where: { productId, organizationId },
      order: { createdAt: 'DESC' },
    });
  }
}
