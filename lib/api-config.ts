export function getBackendUrl() {
    const url = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"

    // If connection is server-to-server (Node.js) and URL is relative
    if (typeof window === 'undefined' && url.startsWith("/")) {

        // Priority 1: Explicit APP_URL (set by user)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL
        if (appUrl) {
            console.log(`[API Config] Using APP_URL: ${appUrl}`)
            return `${appUrl}${url}`
        }

        // Priority 2: VERCEL_URL (auto-set by Vercel)
        const vercelUrl = process.env.VERCEL_URL
        if (vercelUrl) {
            console.log(`[API Config] Using VERCEL_URL: https://${vercelUrl}${url}`)
            return `https://${vercelUrl}${url}`
        }

        console.warn("[API Config] Warning: Running on server with relative URL but no VERCEL_URL or NEXT_PUBLIC_APP_URL found.")
    }

    return url
}
