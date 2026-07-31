import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Plain filled dot, not the ringed mark — this renders at home-screen icon scale, and thin
// curved strokes look grainy at that display size regardless of export resolution. A solid
// shape stays crisp at any size.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1E2239',
        }}
      >
        <div style={{ width: 66, height: 66, borderRadius: '50%', backgroundColor: '#C9B08A', display: 'flex' }} />
      </div>
    ),
    { ...size }
  )
}
