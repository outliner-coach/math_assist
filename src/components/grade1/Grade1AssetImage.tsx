'use client'

import Image from 'next/image'
import React, { useState } from 'react'
import type { ReactNode } from 'react'

import type { Grade1Asset } from '@/lib/grade1-assets'

interface Grade1AssetImageProps {
  asset: Grade1Asset
  className?: string
  fallback?: ReactNode
  priority?: boolean
}

export default function Grade1AssetImage({
  asset,
  className = '',
  fallback = null,
  priority = false,
}: Grade1AssetImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <>{fallback}</>
  }

  return (
    <Image
      src={asset.src}
      alt={asset.decorative ? '' : asset.alt}
      aria-hidden={asset.decorative ? true : undefined}
      className={className}
      draggable={false}
      width={320}
      height={320}
      unoptimized
      priority={priority}
      onError={() => setFailed(true)}
    />
  )
}
