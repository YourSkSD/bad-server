import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import ForbiddenError from '../errors/forbidden-error'

export const CSRF_COOKIE = 'csrfToken'
export const CSRF_HEADER = 'x-csrf-token'

// Кука с CSRF-токеном должна быть читаемой из JS (double-submit),
// поэтому httpOnly: false. Значение всё равно недоступно чужому origin.
const cookieOptions = {
    httpOnly: false,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
}

// Генерирует токен, кладёт его в куку и возвращает клиенту
export function generateCsrfToken(_req: Request, res: Response): string {
    const token = crypto.randomBytes(32).toString('hex')
    res.cookie(CSRF_COOKIE, token, cookieOptions)
    return token
}

function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) {
        return false
    }
    return crypto.timingSafeEqual(bufA, bufB)
}

// Проверка double-submit: заголовок должен совпадать со значением куки
export function csrfProtection(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const cookieToken = req.cookies?.[CSRF_COOKIE]
    const headerToken = req.get(CSRF_HEADER)

    if (
        typeof cookieToken === 'string' &&
        cookieToken.length > 0 &&
        typeof headerToken === 'string' &&
        safeEqual(cookieToken, headerToken)
    ) {
        return next()
    }

    return next(new ForbiddenError('Недействительный CSRF-токен'))
}
