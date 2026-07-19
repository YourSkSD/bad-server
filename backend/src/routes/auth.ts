import { Request, Response, Router } from 'express'
import {
    getCurrentUser,
    getCurrentUserRoles,
    login,
    logout,
    refreshAccessToken,
    register,
    updateCurrentUser,
} from '../controllers/auth'
import auth from '../middlewares/auth'
import { csrfProtection, generateCsrfToken } from '../middlewares/csrf'
import {
    validateAuthentication,
    validateUserBody,
} from '../middlewares/validations'

const authRouter = Router()

// Публичный эндпоинт выдачи CSRF-токена (и установки куки)
authRouter.get('/csrf-token', (req: Request, res: Response) => {
    const csrfToken = generateCsrfToken(req, res)
    res.json({ csrfToken })
})

authRouter.get('/user', auth, getCurrentUser)
authRouter.patch('/me', auth, updateCurrentUser)
authRouter.get('/user/roles', auth, getCurrentUserRoles)
// CSRF защищает формы входа и регистрации
authRouter.post('/login', csrfProtection, validateAuthentication, login)
authRouter.get('/token', refreshAccessToken)
authRouter.get('/logout', logout)
authRouter.post('/register', csrfProtection, validateUserBody, register)

export default authRouter
