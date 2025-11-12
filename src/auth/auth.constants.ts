export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? '2m';
export const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL ?? '7d';
export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET!;
export const REFRESH_COOKIE = 'ats_rtk';
export const COOKIE_SECURE = process.env.NODE_ENV === 'production';
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined; // ej ".tudominio.com" en prod
