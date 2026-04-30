import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

/**
 * Interceptor de autenticação.
 *
 * O que faz:
 * 1. Toda requisição que sai do app passa por aqui
 * 2. Se o back responde com 401 + code "TOKEN_EXPIRED":
 *    → chama POST /auth/refresh com o refreshToken
 *    → salva o novo accessToken
 *    → repete a requisição original com o novo token
 * 3. Se o refresh também falhar (refreshToken expirado ou inválido):
 *    → faz logout e manda pro /login
 * 4. Qualquer outro erro 401 (token inválido, sem token):
 *    → faz logout e manda pro /login
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      // só trata erros 401
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const isTokenExpired = error.error?.code === 'TOKEN_EXPIRED';

      // se não é token expirado (ex: token inválido, sem token) → logout direto
      if (!isTokenExpired) {
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      // token expirado → tenta renovar
      return authService.refreshAccessToken().pipe(
        switchMap((refreshResponse) => {
          const newToken = refreshResponse?.data?.accessToken;

          if (!newToken) {
            // refresh falhou sem erro HTTP — limpa e manda pro login
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => error);
          }

          // repete a requisição original com o novo token
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          });

          return next(retryReq);
        }),
        catchError((refreshError) => {
          // refresh deu 401 → refreshToken expirado ou inválido → logout
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};