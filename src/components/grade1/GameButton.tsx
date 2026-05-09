'use client'

import React from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'quiet'
  asChild?: false
}

const variantStyles = {
  primary:
    'bg-[#58cc02] text-white shadow-[0_5px_0_#3f8f01] hover:bg-[#61d90a] active:translate-y-[3px] active:shadow-[0_2px_0_#3f8f01] disabled:bg-[#afafaf] disabled:shadow-[0_5px_0_#777777]',
  secondary:
    'border-2 border-[#e5e5e5] bg-white text-[#1cb0f6] shadow-[0_5px_0_#d1d5db] hover:bg-sky-50 active:translate-y-[3px] active:shadow-[0_2px_0_#d1d5db] disabled:text-[#afafaf]',
  quiet:
    'bg-[#d7ffb8] text-[#3c3c3c] shadow-[0_5px_0_#9adb72] hover:bg-[#e2ffc9] active:translate-y-[3px] active:shadow-[0_2px_0_#9adb72]',
}

export default function GameButton({
  children,
  className = '',
  variant = 'primary',
  disabled,
  ...props
}: GameButtonProps) {
  return (
    <button
      className={`min-h-[56px] rounded-xl px-6 py-3 text-base font-black tracking-[0.03em] transition disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
