export function getBackendUrl() {
    const url = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"

    // If connection is server-to-server (Node.js) and URL is relative
    if (typeof window === 'undefined' && url.startsWith("/")) {
        // In Vercel, use the project deployment URL
        const vercelUrl = process.env.VERCEL_URL
        if (vercelUrl) {
            return `https://${vercelUrl}${url}`
        }
    }

    return url
}
