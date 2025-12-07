export function getBackendUrl() {
    // Priority 1: Explicit backend URL (for production deployment)
    const explicitUrl = process.env.NEXT_PUBLIC_FASTAPI_URL
    if (explicitUrl) {
        return explicitUrl
    }

    // Priority 2: Local development default
    // For local development, backend runs on localhost:8000
    return "http://localhost:8000"
}
