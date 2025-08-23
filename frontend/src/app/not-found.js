// src/app/not-found.js
'use client'

import dynamic from 'next/dynamic'

const Debug404 = dynamic(() => import('./Debug404'), { ssr: false })

export default function NotFound() {
  return (
    <div>
      <h1>Custom 404</h1>

      <Debug404 />
    </div>
  )
}
