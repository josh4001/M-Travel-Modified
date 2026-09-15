import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Usage: findMe(@CurrentUser() user: AuthUser)
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
