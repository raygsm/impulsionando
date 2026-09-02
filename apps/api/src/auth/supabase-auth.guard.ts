import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import type { AuthedRequest, AuthUser } from "./auth.types";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest & { headers: Record<string, string | string[] | undefined> }>();
    const raw = req.headers.authorization;
    const header = Array.isArray(raw) ? raw[0] : raw;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        error: {
          code: "UNAUTHENTICATED",
          message: "Bearer access token required",
        },
      });
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException({
        error: {
          code: "UNAUTHENTICATED",
          message: "Bearer access token required",
        },
      });
    }

    try {
      const { data, error } = await this.supabase.admin().auth.getUser(token);
      if (error || !data.user) {
        throw new UnauthorizedException({
          error: {
            code: "UNAUTHENTICATED",
            message: "Invalid or expired access token",
          },
        });
      }
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email ?? null,
      };
      req.user = user;
      req.accessToken = token;
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException({
        error: {
          code: "UNAUTHENTICATED",
          message: "Auth verification failed",
        },
      });
    }
  }
}
