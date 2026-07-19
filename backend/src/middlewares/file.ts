import { randomUUID } from 'crypto'
import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { mkdirSync } from 'fs'
import { join } from 'path'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

// Расширение берём из белого списка mime-типов, а не из имени файла пользователя.
// SVG намеренно исключён: он может содержать JS и приводить к stored-XSS при раздаче.
const extByMime: Record<string, string> = {
    'image/png': '.png',
    'image/jpg': '.jpg',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
}

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const destinationPath = join(
            __dirname,
            process.env.UPLOAD_PATH_TEMP
                ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                : '../public'
        )

        mkdirSync(destinationPath, { recursive: true })

        cb(null, destinationPath)
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        // Генерируем безопасное уникальное имя, игнорируя originalname пользователя
        const ext = extByMime[file.mimetype] ?? ''
        cb(null, `${randomUUID()}${ext}`)
    },
})

const types = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif']

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!types.includes(file.mimetype)) {
        return cb(null, false)
    }

    return cb(null, true)
}

export default multer({
    storage,
    fileFilter,
    // Ограничиваем размер (10 МБ) и количество файлов за запрос
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
})
