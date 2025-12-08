'use client'

import React, { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Save } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { useToast } from './ui/Toast'

export interface MailChimpConfig {
  apiKey: string
  serverPrefix: string
  listId: string
  fromName: string
  fromEmail: string
  replyToEmail: string
}

export interface MailChimpConfigFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: MailChimpConfig) => Promise<void>
  onSuccess?: () => void
  initialConfig?: Partial<MailChimpConfig>
}

export function MailChimpConfigForm({
  isOpen,
  onClose,
  onSave,
  onSuccess,
  initialConfig,
}: MailChimpConfigFormProps) {
  const [config, setConfig] = useState<MailChimpConfig>({
    apiKey: initialConfig?.apiKey || '',
    serverPrefix: initialConfig?.serverPrefix || '',
    listId: initialConfig?.listId || '',
    fromName: initialConfig?.fromName || '',
    fromEmail: initialConfig?.fromEmail || '',
    replyToEmail: initialConfig?.replyToEmail || '',
  })

  const [showApiKey, setShowApiKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof MailChimpConfig, string>>>({})
  const toast = useToast()

  // Update config when initialConfig changes (load existing credentials)
  useEffect(() => {
    if (initialConfig) {
      setConfig({
        apiKey: initialConfig.apiKey || '',
        serverPrefix: initialConfig.serverPrefix || '',
        listId: initialConfig.listId || '',
        fromName: initialConfig.fromName || '',
        fromEmail: initialConfig.fromEmail || '',
        replyToEmail: initialConfig.replyToEmail || '',
      })
    }
  }, [initialConfig])

  const handleChange = (field: keyof MailChimpConfig, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MailChimpConfig, string>> = {}

    if (!config.apiKey) {
      newErrors.apiKey = 'API Key is required'
    }
    if (!config.serverPrefix) {
      newErrors.serverPrefix = 'Server Prefix is required'
    }
    if (!config.listId) {
      newErrors.listId = 'List ID is required'
    }
    if (!config.fromName) {
      newErrors.fromName = 'From Name is required'
    }
    if (!config.fromEmail) {
      newErrors.fromEmail = 'From Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.fromEmail)) {
      newErrors.fromEmail = 'Invalid email format'
    }
    if (!config.replyToEmail) {
      newErrors.replyToEmail = 'Reply To Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.replyToEmail)) {
      newErrors.replyToEmail = 'Invalid email format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Validation Error', 'Please fill in all required fields correctly')
      return
    }

    setLoading(true)
    try {
      await onSave(config)
      toast.success('MailChimp Configuration Saved', 'Your MailChimp settings have been saved successfully')
      onSuccess?.()
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Failed to save MailChimp config:', error)
      toast.error('Save Failed', error instanceof Error ? error.message : 'Failed to save MailChimp configuration')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl shadow-2xl border border-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.5 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm7.5 10c0-5.5-4.5-10-10-10S2 6.5 2 12s4.5 10 10 10 10-4.5 10-10zm-10 8c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Chỉnh sửa MailChimp</h2>
              <p className="text-sm text-slate-400">Cấp nhật cấu hình platform của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="auth" className="w-full">
            <TabsList className="w-full bg-slate-800/50 border border-slate-700">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
              >
                Cơ bản
              </TabsTrigger>
              <TabsTrigger
                value="auth"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
              >
                Xác thực
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="mt-6 space-y-4">
              <div className="text-center py-12">
                <p className="text-slate-400">Nội dung cơ bản sẽ được thêm sau</p>
              </div>
            </TabsContent>

            {/* Auth Tab */}
            <TabsContent value="auth" className="mt-6 space-y-6">
              <div className="space-y-6">
                {/* Authentication Info Section */}
                <div className="flex items-start gap-3 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Thông tin xác thực</h3>
                    <p className="text-xs text-slate-400">
                      Nhập API key và thông tin MailChimp của bạn để kết nối
                    </p>
                  </div>
                </div>

                {/* MailChimp API Key */}
                <div className="space-y-2">
                  <Label className="text-white">
                    MailChimp API Key <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={(e) => handleChange('apiKey', e.target.value)}
                      placeholder="abc123456789abcdef..."
                      className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                        errors.apiKey ? 'border-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.apiKey && <p className="text-xs text-red-500">{errors.apiKey}</p>}
                  <p className="text-xs text-slate-400">
                    Your MailChimp API key (without datacenter suffix)
                  </p>
                </div>

                {/* Server Prefix */}
                <div className="space-y-2">
                  <Label className="text-white">
                    Server Prefix (Datacenter) <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="text"
                    value={config.serverPrefix}
                    onChange={(e) => handleChange('serverPrefix', e.target.value)}
                    placeholder="us1"
                    className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                      errors.serverPrefix ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.serverPrefix && (
                    <p className="text-xs text-red-500">{errors.serverPrefix}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Your MailChimp datacenter (e.g., us1, us2, us3)
                  </p>
                </div>

                {/* Email Configuration Section */}
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Email Configuration (Required)
                  </h3>

                  {/* List ID */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-white">
                      List ID (Audience ID) <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="text"
                      value={config.listId}
                      onChange={(e) => handleChange('listId', e.target.value)}
                      placeholder="bf4770006e"
                      className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                        errors.listId ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.listId && <p className="text-xs text-red-500">{errors.listId}</p>}
                    <p className="text-xs text-slate-400">
                      Find this in MailChimp: Audience → Settings → Audience ID
                    </p>
                  </div>

                  {/* From Name */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-white">
                      From Name <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="text"
                      value={config.fromName}
                      onChange={(e) => handleChange('fromName', e.target.value)}
                      placeholder="Hoang Dung AI"
                      className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                        errors.fromName ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.fromName && <p className="text-xs text-red-500">{errors.fromName}</p>}
                  </div>

                  {/* From Email */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-white">
                      From Email <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="email"
                      value={config.fromEmail}
                      onChange={(e) => handleChange('fromEmail', e.target.value)}
                      placeholder="vietemt@gmail.com"
                      className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                        errors.fromEmail ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.fromEmail && <p className="text-xs text-red-500">{errors.fromEmail}</p>}
                  </div>

                  {/* Reply To Email */}
                  <div className="space-y-2">
                    <Label className="text-white">
                      Reply To Email <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="email"
                      value={config.replyToEmail}
                      onChange={(e) => handleChange('replyToEmail', e.target.value)}
                      placeholder="vietemt@gmail.com"
                      className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                        errors.replyToEmail ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.replyToEmail && (
                      <p className="text-xs text-red-500">{errors.replyToEmail}</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </div>
      </div>
    </div>
  )
}

