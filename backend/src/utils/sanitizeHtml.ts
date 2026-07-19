import sanitizeHtml from 'sanitize-html'

// Полностью удаляет любые HTML-теги, оставляя чистый текст.
// Используется для пользовательских строк, которые могут попасть в разметку.
export default function stripHtml(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
}
