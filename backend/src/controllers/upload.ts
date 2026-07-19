import { NextFunction, Request, Response } from 'express'
import { unlink } from 'fs'
import { constants } from 'http2'
import sharp from 'sharp'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }
    // Отсекаем пустые/подозрительно маленькие файлы
    if (req.file.size < 2 * 1024) {
        unlink(req.file.path, () => {})
        return next(new BadRequestError('Файл слишком маленький'))
    }
    // Проверяем, что загружено реальное изображение (а не подделка по mime).
    try {
        const metadata = await sharp(req.file.path).metadata()
        if (!metadata.width || !metadata.height) {
            throw new Error('invalid image')
        }
    } catch {
        unlink(req.file.path, () => {})
        return next(
            new BadRequestError('Файл не является корректным изображением')
        )
    }
    try {
        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file?.filename}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
