import { ErrorRequestHandler } from 'express'

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const statusCode = err.statusCode || 500
    // Наружу не отдаём внутренние детали серверной ошибки
    const message =
        statusCode === 500 ? 'На сервере произошла ошибка' : err.message

    // Логируем только реальные серверные ошибки, без полного дампа на каждый
    // запрос — иначе лог-файлы можно раздуть флудом (DoS).
    if (statusCode === 500) {
        console.error(err.message)
    }

    res.status(statusCode).send({ message })
}

export default errorHandler
