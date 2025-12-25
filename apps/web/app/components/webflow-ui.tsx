// apps/web/app/components/webflow-ui.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "./ThemeProvider"
import { useLanguage } from "../contexts/LanguageContext"

/**
 * Simple className merge helper
 */
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

/* =========================================================
 *  LAYOUT
 * ======================================================= */

/**
 * AppShell – khung chung cho app (navbar + main content)
 * Dùng bao quanh toàn bộ page.
 * 
 * Theme support:
 * - bg-white: nền trắng cho light mode
 * - dark:bg-[#020617]: nền tối cho dark mode (khi có class 'dark' trên <html>)
 * - transition-colors: smooth transition khi đổi theme
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen transition-all duration-500">
      <AppNavbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 md:px-8 md:pt-14">
        {children}
      </main>
    </div>
  )
}

/**
 * Navbar phong cách Webflow: đơn giản, sáng, rộng rãi.
 */
export function AppNavbar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/ideas", label: "Ideas" },
    { href: "/briefs", label: "Briefs" },
    { href: "/rag-demo", label: "RAG" },
    { href: "/packs", label: "Content" },
    { href: "/analytics", label: "Analytics" },
    { href: "/publisher", label: "Publisher" },
    { href: "/settings", label: "Settings" },
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/50 bg-white/80 backdrop-blur-2xl transition-all duration-500 dark:border-white/5 dark:bg-[hsl(var(--background))]/60 shadow-lg shadow-slate-200/20 dark:shadow-black/30">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-20 md:px-8">
        {/* Left: logo + brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a855f7] to-[#ec4899] text-white shadow-lg shadow-[#a855f7]/25">
              <span className="text-sm font-bold">CM</span>
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-[15px] font-semibold tracking-tight text-[hsl(var(--foreground))]">
                Content Multiplier
              </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                AI-powered content studio
              </span>
            </div>
          </Link>
        </div>

        {/* Center: nav links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[hsl(var(--primary))] text-white shadow-md shadow-[hsl(var(--primary))]/25"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-2 text-xs">
          {/* Language toggle */}
          <div className="hidden items-center gap-1 rounded-full bg-[hsl(var(--muted))] px-1 py-1 text-[11px] font-medium md:flex">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setLanguage("en")
              }}
              className={cn(
                "rounded-full px-2 py-0.5 transition-all duration-200 cursor-pointer",
                language === "en"
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setLanguage("vn")
              }}
              className={cn(
                "rounded-full px-2 py-0.5 transition-all duration-200 cursor-pointer",
                language === "vn"
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              VN
            </button>
          </div>

          {/* 
            Theme Toggle Button
            - Sử dụng useTheme() từ ThemeProvider để lấy theme hiện tại và toggle function
            - Khi click: toggleTheme() sẽ:
              1. Đổi theme trong state (light ↔ dark)
              2. Cập nhật class 'dark' trên <html> element
              3. Lưu vào localStorage để giữ theme khi refresh
            - Tailwind CSS tự động áp dụng dark: styles khi có class 'dark' trên <html>
            - suppressHydrationWarning: cho phép nội dung thay đổi sau khi mount mà không gây lỗi
          */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleTheme()
            }}
            className="hidden rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-[11px] font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-200 md:inline-flex cursor-pointer items-center justify-center gap-1.5"
            aria-label="Toggle theme"
          >
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
            <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          {/* CTA */}
          <Link href="/ideas">
            <PrimaryButton size="md">
              ✨ Create Content
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </header>
  )
}

/**
 * Section – block lớn, dùng để gom content theo từng phần (Dashboard, Workflow…)
 */
export function Section({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("mb-12 md:mb-16", className)}>
      {children}
    </section>
  )
}

/**
 * PageHeader – tiêu đề lớn với Aurora gradient
 */
export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string
  eyebrow?: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="space-y-4">
        {eyebrow && (
          <div className="inline-block rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-purple-400 dark:text-purple-300">
            {eyebrow}
          </div>
        )}
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl bg-gradient-to-r from-[hsl(var(--foreground))] via-purple-500 to-pink-500 bg-clip-text text-transparent dark:from-white dark:via-purple-400 dark:to-pink-400">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-base leading-relaxed text-[hsl(var(--muted-foreground))]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  )
}

/* =========================================================
 *  BUTTONS
 * ======================================================= */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function PrimaryButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"

  const variants: Record<ButtonVariant, string> = {
    primary: [
      // Aurora gradient background
      "bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f97316] bg-[length:200%_100%]",
      "text-white font-semibold",
      // Glow effect
      "shadow-lg shadow-purple-500/30",
      // Hover animations
      "hover:bg-[position:100%_0] hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.03] hover:-translate-y-0.5",
      // Active state
      "active:scale-[0.98] active:shadow-md",
      // Transition
      "transition-all duration-300",
    ].join(" "),
    secondary: [
      // Neumorphism light / Glass dark
      "bg-[hsl(var(--card))] text-[hsl(var(--foreground))]",
      "shadow-[4px_4px_10px_rgba(174,174,192,0.2),-4px_-4px_10px_rgba(255,255,255,0.7)]",
      "dark:bg-white/5 dark:backdrop-blur-lg dark:border dark:border-white/10",
      "dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
      // Hover
      "hover:shadow-[6px_6px_14px_rgba(174,174,192,0.25),-6px_-6px_14px_rgba(255,255,255,0.8)]",
      "dark:hover:bg-white/10 dark:hover:border-white/20",
      "hover:scale-[1.02]",
    ].join(" "),
    ghost: [
      "bg-transparent text-[hsl(var(--foreground))]",
      "hover:bg-[hsl(var(--muted))] dark:hover:bg-white/5",
      "border border-transparent",
    ].join(" "),
    danger: [
      "bg-gradient-to-r from-red-500 to-rose-600 text-white",
      "shadow-lg shadow-red-500/30",
      "hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02]",
      "active:scale-[0.98]",
    ].join(" "),
  }

  const sizes: Record<ButtonSize, string> = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  )
}

/* =========================================================
 *  CARD SYSTEM
 * ======================================================= */
interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

/**
 * Card – Aurora Glass + Neumorphism card
 */
export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        "relative rounded-3xl p-6 transition-all duration-500 ease-out overflow-hidden",
        // Light mode: Neumorphism
        "bg-[hsl(var(--card))] shadow-[8px_8px_20px_rgba(174,174,192,0.25),-8px_-8px_20px_rgba(255,255,255,0.8)]",
        // Dark mode: Glassmorphism
        "dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-white/[0.02] dark:backdrop-blur-xl dark:border dark:border-white/10",
        "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]",
        // Hover effects
        onClick && "cursor-pointer",
        onClick && "hover:scale-[1.02] hover:shadow-[12px_12px_30px_rgba(174,174,192,0.35),-12px_-12px_30px_rgba(255,255,255,0.9)]",
        onClick && "dark:hover:border-white/20 dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]",
        className
      )}
    >
      {/* Subtle gradient overlay for glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 dark:opacity-100 pointer-events-none rounded-3xl" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/**
 * SubCard – dùng cho nội dung phụ, form, khu vực nhỏ.
 */
export function SubCard({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-[hsl(var(--card))] p-5 shadow-sm ring-1 ring-[hsl(var(--border))] transition-all duration-300",
        onClick && "cursor-pointer transition-all hover:shadow-md hover:ring-[hsl(var(--primary))]/20",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * CardHeader / CardTitle / CardDescription để nội dung gọn, consistent
 */
export function CardHeader({
  children,
  className,
}: CardProps) {
  return (
    <div className={cn("mb-4 flex flex-col gap-1", className)}>
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className,
}: CardProps) {
  return (
    <h2
      className={cn(
        "text-base font-semibold tracking-tight text-[hsl(var(--card-foreground))] md:text-lg",
        className
      )}
    >
      {children}
    </h2>
  )
}

export function CardDescription({
  children,
  className,
}: CardProps) {
  return (
    <p
      className={cn(
        "text-xs leading-relaxed text-[hsl(var(--muted-foreground))] md:text-sm",
        className
      )}
    >
      {children}
    </p>
  )
}

/* =========================================================
 *  TYPOGRAPHY & BADGE
 * ======================================================= */
export function MutedText({
  children,
  className,
}: CardProps) {
  return (
    <p
      className={cn(
        "text-xs leading-relaxed text-[hsl(var(--muted-foreground))] md:text-sm",
        className
      )}
    >
      {children}
    </p>
  )
}

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "success" | "warning" | "danger" | "info"
}

export function Badge({
  children,
  className,
  variant = "default",
}: BadgeProps) {
  const variants = {
    default: "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 ring-1 ring-emerald-500/20",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 ring-1 ring-amber-500/20",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 ring-1 ring-red-500/20",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 ring-1 ring-blue-500/20",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

/* =========================================================
 *  STATS & EMPTY STATE
 * ======================================================= */
interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  trend?: string
  trendType?: "up" | "down" | "neutral"
  icon?: React.ReactNode
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  trendType = "up",
  icon,
}: StatCardProps) {
  const trendColor =
    trendType === "up"
      ? "text-emerald-500 dark:text-[#22c55e]"
      : trendType === "down"
      ? "text-rose-500"
      : "text-slate-500 dark:text-[#9ca3af]"

  return (
    <SubCard className="flex flex-col gap-2 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
          {label}
        </span>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            {icon}
          </div>
        )}
      </div>
      <span className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
        {value}
      </span>
      {hint && (
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {hint}
        </span>
      )}
      {trend && (
        <span className={cn("text-xs font-medium", trendColor)}>
          {trend}
        </span>
      )}
    </SubCard>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <SubCard className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--muted))] to-[hsl(var(--secondary))]">
        {icon || <span className="text-2xl">✨</span>}
      </div>
      <div>
        <h3 className="text-base font-semibold text-[hsl(var(--foreground))] md:text-lg">
          {title}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
      </div>
      {actionLabel && (
        <PrimaryButton
          size="md"
          variant="secondary"
          onClick={onAction}
        >
          {actionLabel}
        </PrimaryButton>
      )}
    </SubCard>
  )
}

/* =========================================================
 *  HERO (landing / dashboard)
 * ======================================================= */
interface HeroProps {
  heading: string
  subheading?: string
  kicker?: string
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
}

export function Hero({
  heading,
  subheading,
  kicker,
  primaryAction,
  secondaryAction,
}: HeroProps) {
  return (
    <Card className="mb-10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--accent))]/30 to-[hsl(var(--accent))]/20">
      <div className="mx-auto max-w-3xl py-8 text-center">
        {kicker && (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-[hsl(var(--primary))]">
            {kicker}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))] md:text-4xl lg:text-5xl">
          {heading}
        </h1>
        {subheading && (
          <p className="mt-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
            {subheading}
          </p>
        )}
        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </Card>
  )
}

/* =========================================================
 *  FORM ELEMENTS
 * ======================================================= */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          {label}
        </label>
      )}
      <input
        className={cn(
          // Base styles
          "rounded-2xl px-4 py-3 text-sm transition-all duration-300",
          // Light mode: Neumorphism inset
          "bg-[hsl(var(--card))] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.7)]",
          // Dark mode: Glass effect
          "dark:bg-white/5 dark:backdrop-blur-lg dark:border dark:border-white/10",
          // Text
          "text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]",
          // Focus states
          "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30",
          "focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.25),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]",
          "dark:focus:border-[hsl(var(--primary))]/50 dark:focus:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
          // Error state
          error && "ring-2 ring-red-500/30 dark:border-red-500/50",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[hsl(var(--foreground))]">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "rounded-xl border border-[hsl(var(--input-border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] transition-all duration-200 focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[hsl(var(--foreground))]">
          {label}
        </label>
      )}
      <select
        className={cn(
          "rounded-xl border border-[hsl(var(--input-border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] transition-all duration-200 focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  )
}

/* =========================================================
 *  TABLE
 * ======================================================= */
interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-[hsl(var(--border))]">
      <table className={cn("w-full", className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn("bg-[hsl(var(--muted))] dark:bg-[hsl(var(--secondary))]", className)}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={cn("divide-y divide-[hsl(var(--border))]", className)}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={cn("bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] transition-colors duration-150", className)}>
      {children}
    </tr>
  )
}

export function TableHead({ children, className }: TableProps) {
  return (
    <th className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]", className)}>
      {children}
    </th>
  )
}

export function TableCell({ children, className }: TableProps) {
  return (
    <td className={cn("px-4 py-3 text-sm text-[hsl(var(--foreground))]", className)}>
      {children}
    </td>
  )
}

/* =========================================================
 *  TABS
 * ======================================================= */
interface TabsProps {
  tabs: Array<{ id: string; label: string; count?: number }>
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-1 rounded-full bg-[hsl(var(--muted))] p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
            activeTab === tab.id
              ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm ring-1 ring-[hsl(var(--border))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card))]"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <Badge variant={activeTab === tab.id ? "info" : "default"}>
              {tab.count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  )
}

/* =========================================================
 *  GRID LAYOUTS
 * ======================================================= */
interface GridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  className?: string
}

export function Grid({ children, cols = 3, className }: GridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={cn("grid gap-4 md:gap-6", gridCols[cols], className)}>
      {children}
    </div>
  )
}

/* =========================================================
 *  LOADING & SKELETON
 * ======================================================= */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-200 dark:bg-[#0b1120]",
        className
      )}
    />
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
    </div>
  )
}

/* =========================================================
 *  ALERT / TOAST
 * ======================================================= */
interface AlertProps {
  type: "success" | "error" | "warning" | "info"
  title?: string
  message: string
  onClose?: () => void
}

export function Alert({ type, title, message, onClose }: AlertProps) {
  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-[#22c55e]",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
    warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-[#facc15]",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-[#38bdf8]",
  }

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-4", styles[type])}>
      <span className="text-lg">{icons[type]}</span>
      <div className="flex-1">
        {title && <h4 className="font-semibold">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-lg opacity-60 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  )
}

