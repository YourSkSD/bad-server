import crypto from 'crypto'
import { CookieOptions } from 'express'
import ms from 'ms'

// Если секрет не задан в окружении — генерируем случайный (без предсказуемого
// хардкода). При отсутствии env токены не переживут перезапуск, но подделать
// их по известному значению нельзя.
const randomSecret = () => crypto.randomBytes(32).toString('hex')

const isProduction = process.env.NODE_ENV === 'production'

export const { PORT = '3000' } = process.env
export const { DB_ADDRESS = 'mongodb://127.0.0.1:27017/weblarek' } = process.env
export const ORIGIN_ALLOW = process.env.ORIGIN_ALLOW || 'http://localhost'
export const JWT_SECRET = process.env.JWT_SECRET || randomSecret()
export const ACCESS_TOKEN = {
    secret: process.env.AUTH_ACCESS_TOKEN_SECRET || randomSecret(),
    expiry: process.env.AUTH_ACCESS_TOKEN_EXPIRY || '10m',
}
export const REFRESH_TOKEN = {
    secret: process.env.AUTH_REFRESH_TOKEN_SECRET || randomSecret(),
    expiry: process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d',
    cookie: {
        name: 'refreshToken',
        options: {
            httpOnly: true,
            sameSite: 'strict',
            secure: isProduction,
            maxAge: ms(process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d'),
            path: '/',
        } as CookieOptions,
    },
}
