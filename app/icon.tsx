import { ImageResponse } from "next/og"

export const size = { width: 512, height: 512 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "96px",
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: "300px",
          fontWeight: 700,
          fontFamily: "serif",
          display: "flex",
          lineHeight: 1,
          letterSpacing: "-0.05em",
        }}
      >
        C
      </div>
    </div>,
    size
  )
}
