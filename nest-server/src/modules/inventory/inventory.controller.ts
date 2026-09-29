import { Body, Controller, Get, Param, Post, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { StockMovementsService } from './stock-movements.service.js';
import { StockAlertsService } from './stock-alerts.service.js';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto.js';
import type { AuthenticatedRequest } from '../../common/types/request-context.type.js';

/**
 * REST surface for `inventory` (Part 4.1) and its two read-only companion
 * tables — `stock_movement` (Part 4.3, audit trail) and `stock_alert`
 * (Part 4.4, low/out-of-stock alerts) — plus the one write path exposed
 * publicly on inventory itself (manual adjustment/damage).
 *
 * reserve/release/convert/consume (InventoryService) are deliberately NOT
 * routed here — see inventory.service.ts's class comment. Only a future
 * Checkout/Order module calls those directly.
 */
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly stockMovementsService: StockMovementsService,
    private readonly stockAlertsService: StockAlertsService,
  ) {}

  @Get('alerts')
  findOpenAlerts(@Req() req: AuthenticatedRequest) {
    return this.stockAlertsService.findAllOpen(req.user.organizationId);
  }

  @Post('alerts/:alertId/resolve')
  resolveAlert(@Param('alertId') alertId: string, @Req() req: AuthenticatedRequest) {
    return this.stockAlertsService.resolve(alertId, req.user.organizationId);
  }

  @Get(':productId')
  findByProduct(@Param('productId') productId: string, @Req() req: AuthenticatedRequest) {
    return this.inventoryService.findByProduct(productId, req.user.organizationId);
  }

  @Get(':productId/movements')
  findMovements(@Param('productId') productId: string, @Req() req: AuthenticatedRequest) {
    return this.stockMovementsService.findAllForProduct(productId, req.user.organizationId);
  }

  @Post(':productId/adjust')
  adjust(
    @Param('productId') productId: string,
    @Body() dto: AdjustInventoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.inventoryService.recordManualAdjustment(
      productId,
      req.user.organizationId,
      { quantityChange: dto.quantityChange.toString(), notes: dto.notes, userId: req.user.userId },
      dto.movementType,
    );
  }
}
