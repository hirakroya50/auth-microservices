import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    console.log({ requiredRoles });
    if (!requiredRoles) {
      return true;
    }

    const request = context?.switchToHttp()?.getRequest();

    // Extract refresh token from cookies or form the headers
    const token =
      request.headers?.authorization?.split(' ')[1] ||
      request?.cookies?.accessToken;
    console.log({
      token,
    });
    if (!token) return false;
    console.log(this.jwtService?.decode(token));

    const user = this.jwtService.decode(token) as {
      role: 'ADMIN' | 'USER' | 'MANAGER';
    };

    console.log({ user });

    return requiredRoles.includes(user.role);
  }
}
