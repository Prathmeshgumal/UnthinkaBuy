export function getBackendUrl() {
    // Priority 1: Explicit backend URL (required in production)
    const explicitUrl = process.env.NEXT_PUBLIC_FASTAPI_URL
    if (explicitUrl) {
        return explicitUrl
    }

    // Development fallback
    if (process.env.NODE_ENV === 'development') {
        return "http://localhost:8000"
    }

    // Production fallback - try to use relative path if backend is on same domain
    // This assumes the backend is deployed as a separate service
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
        console.log(`[API Config] Using APP_URL: ${appUrl}`)
        return appUrl
    }

    // VERCEL_URL fallback (for server-side only)
    if (typeof window === 'undefined') {
        const vercelUrl = process.env.VERCEL_URL
        if (vercelUrl) {
            console.log(`[API Config] Using VERCEL_URL: https://${vercelUrl}`)
            return `https://${vercelUrl}`
        }
    }

    console.error("[API Config] ERROR: NEXT_PUBLIC_FASTAPI_URL is not set! Backend API calls will fail.")
    // Return empty string to make errors obvious
    return ""
}
