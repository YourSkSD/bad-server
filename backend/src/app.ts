import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS, ORIGIN_ALLOW } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

// За nginx: доверяем первому прокси, чтобы rate-limit видел реальный IP клиента
app.set('trust proxy', 1)

// Защитные HTTP-заголовки и удаление X-Powered-By.
// crossOriginResourcePolicy ослаблен, чтобы не ломать раздачу картинок.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

app.use(cookieParser())

// CORS ограничен доверенным origin, разрешаем передачу учётных данных
const corsOptions = { origin: ORIGIN_ALLOW, credentials: true }
app.use(cors(corsOptions))

app.use(serveStatic(path.join(__dirname, 'public')))

// Ограничение частоты запросов к API (защита от флуда/DDoS).
// Короткое окно: всплеск одновременных запросов режется, обычная
// последовательная работа приложения под лимит не попадает.
const limiter = rateLimit({
    windowMs: 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
})
app.use(limiter)

// Ограничиваем размер тела запроса, чтобы исключить переполнение памяти
app.use(urlencoded({ extended: true, limit: '10kb' }))
app.use(json({ limit: '10kb' }))

app.options('*', cors(corsOptions))
app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
