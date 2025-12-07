import { ImageResponse } from "next/og"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Image metadata
export const size = {
    width: 32,
    height: 32,
}
export const contentType = "image/png"

// Image generation
export default function Icon() {
    const faviconPath = join(process.cwd(), "public", "favicon.jpg")
    const faviconData = readFileSync(faviconPath)
    const src = `data:image/jpeg;base64,${faviconData.toString("base64")}`

    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 24,
                    background: "transparent",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    overflow: "hidden",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Favicon" width="100%" height="100%" style={{ objectFit: "cover" }} />
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        },
    )
}
