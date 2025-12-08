'use client'

import React, { useState } from 'react'
import { Check, X, Link2, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '@/app/lib/utils'

export interface PlatformAuthConfig {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  requiredFields?: string[]
}

export interface PlatformAuthStatus {
  connected: boolean
  username?: string
  email?: string
  lastConnected?: Date
  tokenExpiry?: Date
}

export interface PlatformAuthProps {
  platforms: PlatformAuthConfig[]
  authStatuses?: Record<string, PlatformAuthStatus>
  onConnect?: (platformId: string) => Promise<void>
  onDisconnect?: (platformId: string) => Promise<void>
  className?: string
}

export function PlatformAuth({
  platforms,
  authStatuses = {},
  onConnect,
  onDisconnect,
  className,
}: PlatformAuthProps) {
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null)

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId)
    try {
      await onConnect?.(platformId)
    } catch (error) {
      console.error(`Failed to connect to ${platformId}:`, error)
    } finally {
      setConnectingPlatform(null)
    }
  }

  const handleDisconnect = async (platformId: string) => {
    setDisconnectingPlatform(platformId)
    try {
      await onDisconnect?.(platformId)
    } catch (error) {
      console.error(`Failed to disconnect from ${platformId}:`, error)
    } finally {
      setDisconnectingPlatform(null)
    }
  }

  const isTokenExpiring = (status: PlatformAuthStatus): boolean => {
    if (!status.tokenExpiry) return false
    const daysUntilExpiry = Math.floor(
      (status.tokenExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  const isTokenExpired = (status: PlatformAuthStatus): boolean => {
    if (!status.tokenExpiry) return false
    return status.tokenExpiry.getTime() < Date.now()
  }

  return (
    <div className={cn('space-y-4', className)}>
      {platforms.map((platform) => {
        const status = authStatuses[platform.id]
        const isConnected = status?.connected || false
        const isConnecting = connectingPlatform === platform.id
        const isDisconnecting = disconnectingPlatform === platform.id
        const tokenExpiring = status && isTokenExpiring(status)
        const tokenExpired = status && isTokenExpired(status)

        return (
          <Card
            key={platform.id}
            className={cn(
              'border-2 transition-all',
              isConnected && !tokenExpired
                ? 'border-green-500/30 bg-green-50/10 dark:bg-green-950/10'
                : tokenExpired
                ? 'border-red-500/30 bg-red-50/10 dark:bg-red-950/10'
                : tokenExpiring
                ? 'border-yellow-500/30 bg-yellow-50/10 dark:bg-yellow-950/10'
                : 'border-slate-200 dark:border-slate-800'
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-3 rounded-lg',
                      isConnected && !tokenExpired
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-slate-100 dark:bg-slate-800'
                    )}
                  >
                    {platform.icon}
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {platform.name}
                      {isConnected && !tokenExpired && (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      {tokenExpired && (
                        <Badge variant="destructive">
                          <X className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                      {tokenExpiring && !tokenExpired && (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">{platform.description}</CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={isDisconnecting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {isConnected && status && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {status.username && (
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Username</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {status.username}
                      </p>
                    </div>
                  )}
                  {status.email && (
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Email</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {status.email}
                      </p>
                    </div>
                  )}
                  {status.lastConnected && (
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Last Connected</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {status.lastConnected.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {status.tokenExpiry && (
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Token Expiry</p>
                      <p
                        className={cn(
                          'font-medium',
                          tokenExpired
                            ? 'text-red-600 dark:text-red-400'
                            : tokenExpiring
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-slate-900 dark:text-slate-100'
                        )}
                      >
                        {status.tokenExpiry.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {tokenExpiring && !tokenExpired && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      Your access token will expire soon. Please reconnect to continue publishing.
                    </p>
                  </div>
                )}

                {tokenExpired && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <X className="h-4 w-4 inline mr-2" />
                      Your access token has expired. Please reconnect to resume publishing.
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

