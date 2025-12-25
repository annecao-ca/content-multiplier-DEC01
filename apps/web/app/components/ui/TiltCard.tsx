'use client'

import React, { useRef, useState, ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface TiltCardProps {
  children: ReactNode
  className?: string
  glowColor?: 'purple' | 'pink' | 'cyan' | 'aurora'
  intensity?: 'light' | 'medium' | 'strong'
  glass?: boolean
  neu?: boolean
}

/**
 * TiltCard - Apple-style 3D tilt effect on hover
 * Kết hợp Glassmorphism và Neumorphism
 */
export function TiltCard({
  children,
  className,
  glowColor = 'purple',
  intensity = 'medium',
  glass = true,
  neu = false,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 })

  const intensityMap = {
    light: 5,
    medium: 10,
    strong: 15,
  }

  const maxRotation = intensityMap[intensity]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY

    const rotateX = (mouseY / (rect.height / 2)) * -maxRotation
    const rotateY = (mouseX / (rect.width / 2)) * maxRotation

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`)
    
    // Update glow position
    const glowX = ((e.clientX - rect.left) / rect.width) * 100
    const glowY = ((e.clientY - rect.top) / rect.height) * 100
    setGlowPosition({ x: glowX, y: glowY })
  }

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)')
    setGlowPosition({ x: 50, y: 50 })
  }

  const glowColors = {
    purple: 'rgba(139, 92, 246, 0.4)',
    pink: 'rgba(236, 72, 153, 0.4)',
    cyan: 'rgba(6, 182, 212, 0.4)',
    aurora: 'rgba(168, 85, 247, 0.3)',
  }

  const baseStyles = cn(
    'relative overflow-hidden rounded-2xl transition-all duration-300 ease-out',
    glass && 'glass-card',
    neu && 'neu',
    className
  )

  return (
    <div
      ref={cardRef}
      className={baseStyles}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Dynamic glow effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, ${glowColors[glowColor]} 0%, transparent 60%)`,
          opacity: transform ? 1 : 0,
        }}
      />
      
      {/* Shine effect on top */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)`,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </div>
  )
}

/**
 * GlassCard - Glassmorphism card without tilt
 */
export function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6',
        hover && 'hover-lift',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * NeuCard - Neumorphism card
 */
export function NeuCard({
  children,
  className,
  inset = false,
}: {
  children: ReactNode
  className?: string
  inset?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        inset ? 'neu-inset' : 'neu',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * AuroraCard - Card with animated aurora border
 */
export function AuroraCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('aurora-border p-6', className)}>
      {children}
    </div>
  )
}

export default TiltCard

