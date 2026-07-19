import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    const resolvedBase = path.resolve(baseDir)

    return (req: Request, res: Response, next: NextFunction) => {
        // Декодируем путь; на битом URL-кодировании считаем, что файла нет
        let decodedPath: string
        try {
            decodedPath = decodeURIComponent(req.path)
        } catch {
            return next()
        }

        // Нормализуем и строим абсолютный путь к запрошенному файлу
        const normalizedPath = path.normalize(decodedPath)
        const resolvedPath = path.resolve(
            resolvedBase,
            `.${path.sep}${normalizedPath}`
        )

        // Защита от обхода директорий: путь обязан лежать внутри baseDir
        if (
            resolvedPath !== resolvedBase &&
            !resolvedPath.startsWith(resolvedBase + path.sep)
        ) {
            return next()
        }

        // Отдаём только существующие обычные файлы (не каталоги)
        return fs.stat(resolvedPath, (statErr, stats) => {
            if (statErr || !stats.isFile()) {
                return next()
            }
            return res.sendFile(resolvedPath, (sendErr) => {
                if (sendErr) {
                    next(sendErr)
                }
            })
        })
    }
}
