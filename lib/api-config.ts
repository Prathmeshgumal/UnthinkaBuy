export function getBackendUrl() {
    // Priority 1: Explicit backend URL (for separate backend deployment)
    const explicitUrl = process.env.NEXT_PUBLIC_FASTAPI_URL
    if (explicitUrl) {
        return explicitUrl
    }

    // Priority 2: If no explicit URL, use relative path (for Vercel serverless functions)
    // This means the backend is deployed on the same Vercel project
    if (typeof window === 'undefined') {
        // Server-side: use relative path
        return ""
    } else {
        // Client-side: use relative path (same origin)
        return ""
    }
}
