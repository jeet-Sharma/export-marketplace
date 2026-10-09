import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Thin wrapper around Passport's 'jwt' strategy so it can be applied via
// @UseGuards(JwtAuthGuard) with a descriptive name, matching the
// convention used by PermissionsGuard below.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
