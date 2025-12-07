// apps/web/app/components/dashboard-ui.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Badge, PrimaryButton, Card, CardHeader, CardTitle, CardDescription } from "./webflow-ui"

/**
 * DashboardHero - Hero section với gradient dark mode
 * Pattern: Gradient từ primary → primary-accent với shadow glow
 */
export function DashboardHero({
  title,
  description,
  cta,
}: {
  title: string
  description: string
  cta?: React.ReactNode
}) {
  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-br from-[#7c3aed] via-[#9333ea] to-[#db2777] px-8 py-8 text-white shadow-[0_24px_80px_rgba(129,140,248,0.35)] md:px-10 md:py-9">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/90">
            {description}
          </p>
        </div>
        {cta && (
          <div className="flex justify-start md:justify-end">
            {cta}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * ActivityItemDark - Activity row với hover states
 * Pattern: Icon + Content + Badge với hover lift effect
 */
interface ActivityItemProps {
  icon: string | React.ReactNode
  text: string
  time: string
  platforms?: string[]
  link?: string
  linkLabel?: string
}

export function ActivityItemDark({
  icon,
  text,
  time,
  platforms,
  link,
  linkLabel = "View details →",
}: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-transform hover:-translate-y-[1px] hover:bg-slate-50 hover:shadow-md dark:bg-[#020617] dark:ring-[rgba(148,163,184,0.12)] dark:hover:bg-[#0b1120]/90">
      <div className="shrink-0 text-2xl">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900 dark:text-[#e5e7eb]">
          {text}
        </div>
        {platforms && platforms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {platforms.map((platform, idx) => (
              <Badge key={idx} variant="info">
                {platform}
              </Badge>
            ))}
          </div>
        )}
        {link && (
          <Link
            href={link}
            className="mt-1 inline-block text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {linkLabel}
          </Link>
        )}
      </div>
      <Badge variant="default">{time} ago</Badge>
    </div>
  )
}

/**
 * ActivitySection - Section wrapper cho activity list
 */
interface ActivitySectionProps {
  title: string
  description: string
  viewAllHref?: string
  children: React.ReactNode
}

export function ActivitySection({
  title,
  description,
  viewAllHref,
  children,
}: ActivitySectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {viewAllHref && (
            <Link href={viewAllHref}>
              <PrimaryButton variant="ghost" size="sm">
                View All <ExternalLink className="ml-1 h-4 w-4" />
              </PrimaryButton>
            </Link>
          )}
        </div>
      </CardHeader>
      <div className="space-y-3">{children}</div>
    </Card>
  )
}

/**
 * DashboardStatCard - Wrapper cho StatCard với dark mode styling
 * (StatCard đã có dark mode support, component này chỉ để consistency)
 */
export { StatCard as DashboardStatCard } from "./webflow-ui"

/**
 * PageHeaderDark - PageHeader với dark background
 * Pattern: Text sáng trên nền dark (không gradient)
 */
export function PageHeaderDark({
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
    <div className="mb-8 rounded-3xl bg-[#020617] px-8 py-8 ring-1 ring-[rgba(148,163,184,0.12)] md:px-10 md:py-9">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow && (
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#9ca3af]">
              {eyebrow}
            </div>
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-[#e5e7eb] md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9ca3af]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex justify-start md:justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

