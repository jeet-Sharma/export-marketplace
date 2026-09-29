import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockAlertEntity } from './entities/stock-alert.entity.js';

/**
 * Part 4.4 — stock_alert. Alerts are opened by a daily low-stock scan job
 * (not built in this pass — Part 4.4's "Why" describes it, this module
 * only reads and resolves what that job would create). Only OPEN/NOTIFIED
 * alerts exist per product at a time (one_open_alert partial unique
 * index, migration-only) — resolving is what lets a future alert for the
 * same product be opened again.
 */
@Injectable()
export class StockAlertsService {
  constructor(
    @InjectRepository(StockAlertEntity)
    private readonly alertRepository: Repository<StockAlertEntity>,
  ) {}

  async findAllOpen(organizationId: string): Promise<StockAlertEntity[]> {
    return this.alertRepository.find({
      where: [
        { organizationId, status: 'OPEN' },
        { organizationId, status: 'NOTIFIED' },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async resolve(alertId: string, organizationId: string): Promise<StockAlertEntity> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId, organizationId } });
    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }
    if (alert.status === 'RESOLVED') {
      throw new ConflictException(`Alert ${alertId} is already resolved.`);
    }

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date();
    return this.alertRepository.save(alert);
  }
}
