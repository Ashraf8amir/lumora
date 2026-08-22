export interface BaseJwtPayload {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
}
