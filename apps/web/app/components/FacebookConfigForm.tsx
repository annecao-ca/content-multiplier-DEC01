'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { useToast } from './ui/Toast'

export interface FacebookPage {
  id: string
  name: string
  access_token?: string
}

export interface FacebookConfig {
  configName: string
  defaultHashtags: string
  timezone: string
  appId: string
  appSecret: string
  pageAccessToken: string
  pageId: string
  pageName?: string
  enableLinkPreview?: boolean
  defaultScheduling?: 'immediate' | 'scheduled'
}

export interface FacebookConfigFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: FacebookConfig) => Promise<void>
  onSuccess?: () => void
  initialConfig?: Partial<FacebookConfig>
}

const API_URL = 'http://localhost:3001'

// Common timezones list
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (HKT)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (ICT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEST/AEDT)' },
]

export function FacebookConfigForm({
  isOpen,
  onClose,
  onSave,
  onSuccess,
  initialConfig,
}: FacebookConfigFormProps) {
  const [config, setConfig] = useState<FacebookConfig>({
    configName: initialConfig?.configName || '',
    defaultHashtags: initialConfig?.defaultHashtags || '',
    timezone: initialConfig?.timezone || '',
    appId: initialConfig?.appId || '',
    appSecret: initialConfig?.appSecret || '',
    pageAccessToken: initialConfig?.pageAccessToken || '',
    pageId: initialConfig?.pageId || '',
    pageName: initialConfig?.pageName || '',
    enableLinkPreview: initialConfig?.enableLinkPreview ?? true,
    defaultScheduling: initialConfig?.defaultScheduling || 'immediate',
  })

  const [pages, setPages] = useState<FacebookPage[]>([])
  const [loadingPages, setLoadingPages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(false)
  const [showAppSecret, setShowAppSecret] = useState(false)
  const [showPageAccessToken, setShowPageAccessToken] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FacebookConfig, string>>>({})
  const [oauthConnected, setOauthConnected] = useState(false)
  const toast = useToast()

  // Check OAuth connection status
  useEffect(() => {
    if (isOpen) {
      checkOAuthConnection()
    }
  }, [isOpen])

  // Update config when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setConfig({
        configName: initialConfig.configName || '',
        defaultHashtags: initialConfig.defaultHashtags || '',
        timezone: initialConfig.timezone || '',
        appId: initialConfig.appId || '',
        appSecret: initialConfig.appSecret || '',
        pageAccessToken: initialConfig.pageAccessToken || '',
        pageId: initialConfig.pageId || '',
        pageName: initialConfig.pageName || '',
        enableLinkPreview: initialConfig.enableLinkPreview ?? true,
        defaultScheduling: initialConfig.defaultScheduling || 'immediate',
      })
    } else {
      // Reset to empty state when no initialConfig
      setConfig({
        configName: '',
        defaultHashtags: '',
        timezone: '',
        appId: '',
        appSecret: '',
        pageAccessToken: '',
        pageId: '',
        pageName: '',
        enableLinkPreview: true,
        defaultScheduling: 'immediate',
      })
    }
  }, [initialConfig])

  async function checkOAuthConnection() {
    try {
      const res = await fetch(`${API_URL}/api/publishing/credentials`)
      const data = await res.json()
      if (data.ok) {
        const facebookCred = data.credentials?.find((c: any) => c.platform === 'facebook' && c.is_active)
        setOauthConnected(!!facebookCred)
      }
    } catch (error) {
      console.error('Failed to check OAuth connection:', error)
      setOauthConnected(false)
    }
  }

  async function fetchPages() {
    if (!oauthConnected) {
      toast.error('OAuth Required', 'Please connect your Facebook account first')
      return
    }

    setLoadingPages(true)
    try {
      const res = await fetch(`${API_URL}/api/publishing/credentials/facebook/pages`)
      const data = await res.json()
      
      if (data.ok && data.pages) {
        setPages(data.pages)
        toast.success('Pages Loaded', `Found ${data.pages.length} Facebook page(s)`)
      } else {
        toast.error('Failed to Load Pages', data.error || 'Could not fetch Facebook pages')
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error)
      toast.error('Error', 'Failed to fetch Facebook pages')
    } finally {
      setLoadingPages(false)
    }
  }

  const handleChange = (field: keyof FacebookConfig, value: string | boolean) => {
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

  async function checkConnection() {
    if (!config.appId || !config.appSecret || !config.pageAccessToken || !config.pageId) {
      toast.error('Thiếu thông tin', 'Vui lòng điền đầy đủ App ID, App Secret, Page Access Token và Page ID')
      return
    }

    setCheckingConnection(true)
    try {
      // Test connection by making an API call to Facebook Graph API
      const testUrl = `https://graph.facebook.com/v18.0/${config.pageId}?access_token=${config.pageAccessToken}&fields=id,name`
      const response = await fetch(testUrl)
      
      if (response.ok) {
        const data = await response.json()
        toast.success('Kết nối thành công', `Đã kết nối với Page: ${data.name || config.pageId}`)
        if (data.name) {
          setConfig((prev) => ({ ...prev, pageName: data.name }))
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
        toast.error('Kết nối thất bại', errorData.error?.message || 'Không thể kết nối với Facebook API')
      }
    } catch (error) {
      console.error('Connection check error:', error)
      toast.error('Lỗi kết nối', error instanceof Error ? error.message : 'Không thể kiểm tra kết nối')
    } finally {
      setCheckingConnection(false)
    }
  }

  const handlePageSelect = (page: FacebookPage) => {
    setConfig((prev) => ({
      ...prev,
      pageId: page.id,
      pageName: page.name,
    }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FacebookConfig, string>> = {}

    const configName = (config.configName || '').trim()
    const appId = (config.appId || '').trim()
    const appSecret = (config.appSecret || '').trim()
    const pageAccessToken = (config.pageAccessToken || '').trim()
    const pageId = (config.pageId || '').trim()

    if (!configName) {
      newErrors.configName = 'Tên cấu hình là bắt buộc'
    }

    if (!appId) {
      newErrors.appId = 'App ID là bắt buộc'
    }

    if (!appSecret) {
      newErrors.appSecret = 'App Secret là bắt buộc'
    }

    if (!pageAccessToken) {
      newErrors.pageAccessToken = 'Page Access Token là bắt buộc'
    }

    if (!pageId) {
      newErrors.pageId = 'Page ID là bắt buộc'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Lỗi xác thực', 'Vui lòng điền đầy đủ các trường bắt buộc')
      return
    }

    setLoading(true)
    try {
      // Ensure all fields are properly formatted before sending
      const configToSave: FacebookConfig = {
        configName: (config.configName || '').trim(),
        defaultHashtags: config.defaultHashtags || '',
        timezone: config.timezone || '',
        appId: (config.appId || '').trim(),
        appSecret: (config.appSecret || '').trim(),
        pageAccessToken: (config.pageAccessToken || '').trim(),
        pageId: (config.pageId || '').trim(),
        pageName: (config.pageName || '').trim(),
        enableLinkPreview: config.enableLinkPreview ?? true,
        defaultScheduling: config.defaultScheduling || 'immediate',
      }
      
      // Double-check validation before sending
      if (!configToSave.configName || !configToSave.appId || !configToSave.appSecret || 
          !configToSave.pageAccessToken || !configToSave.pageId) {
        toast.error('Lỗi xác thực', 'Vui lòng điền đầy đủ các trường bắt buộc')
        return
      }
      
      console.log('Saving Facebook config:', { ...configToSave, appSecret: '***', pageAccessToken: '***' })
      await onSave(configToSave)
      toast.success('Lưu thành công', 'Cấu hình Facebook đã được lưu thành công')
      onSuccess?.()
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Failed to save Facebook config:', error)
      const errorMessage = error instanceof Error ? error.message : 'Không thể lưu cấu hình Facebook'
      toast.error('Lưu thất bại', errorMessage)
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
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Thêm Facebook</h2>
              <p className="text-sm text-slate-400">Cấu hình kết nối với platform mới</p>
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
          <Tabs defaultValue="basic" className="w-full">
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
              <TabsTrigger
                value="advanced"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
              >
                Nâng cao
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="mt-6 space-y-6">
              <div className="space-y-6">
                {/* Configuration Name */}
                <div className="space-y-2">
                  <Label className="text-white">
                    Tên cấu hình <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="text"
                    value={config.configName}
                    onChange={(e) => handleChange('configName', e.target.value)}
                    placeholder="My Facebook"
                    className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                      errors.configName ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.configName && <p className="text-xs text-red-500">{errors.configName}</p>}
                </div>

                {/* Default Hashtags */}
                <div className="space-y-2">
                  <Label className="text-white">Default Hashtags</Label>
                  <input
                    type="text"
                    value={config.defaultHashtags}
                    onChange={(e) => handleChange('defaultHashtags', e.target.value)}
                    placeholder="#marketing, #content"
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                    <p className="text-xs text-slate-400">
                    Nhập các hashtag mặc định, phân cách bằng dấu phẩy
                    </p>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label className="text-white">Timezone</Label>
                  <select
                    value={config.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white"
                  >
                    <option value="">Select timezone</option>
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400">
                    Chọn múi giờ cho việc lên lịch đăng bài
                    </p>
                  </div>
              </div>
            </TabsContent>

            {/* Authentication Tab */}
            <TabsContent value="auth" className="mt-6 space-y-6">
              <div className="space-y-6">
                {/* Authentication Info Section */}
                <div className="flex items-start gap-3 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1">Thông tin xác thực</h3>
                    <p className="text-xs text-slate-400 mb-2">
                      Facebook Graph API Authentication. Create a Facebook App and generate an Access Token with pages_manage_posts permission.
                    </p>
                    <a
                      href="https://developers.facebook.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      Open Developer Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* App ID */}
                <div className="space-y-2">
                  <Label className="text-white">
                    App ID <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="text"
                    value={config.appId}
                    onChange={(e) => handleChange('appId', e.target.value)}
                    placeholder="your-app-id"
                    className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                      errors.appId ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.appId && <p className="text-xs text-red-500">{errors.appId}</p>}
                </div>

                {/* App Secret */}
                <div className="space-y-2">
                  <Label className="text-white">
                    App Secret <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      type={showAppSecret ? 'text' : 'password'}
                      value={config.appSecret}
                      onChange={(e) => handleChange('appSecret', e.target.value)}
                      placeholder="your-app-secret"
                      className={`flex h-10 w-full rounded-md border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                        errors.appSecret ? 'border-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAppSecret(!showAppSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showAppSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.appSecret && <p className="text-xs text-red-500">{errors.appSecret}</p>}
                  </div>

                {/* Page Access Token */}
                    <div className="space-y-2">
                  <Label className="text-white">
                    Page Access Token <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      type={showPageAccessToken ? 'text' : 'password'}
                      value={config.pageAccessToken}
                      onChange={(e) => handleChange('pageAccessToken', e.target.value)}
                      placeholder="your-page-access-token"
                      className={`flex h-10 w-full rounded-md border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                        errors.pageAccessToken ? 'border-red-500' : ''
                      }`}
                    />
                          <button
                      type="button"
                      onClick={() => setShowPageAccessToken(!showPageAccessToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                      {showPageAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                      </div>
                  {errors.pageAccessToken && <p className="text-xs text-red-500">{errors.pageAccessToken}</p>}
                    </div>

                {/* Page ID */}
                  <div className="space-y-2">
                    <Label className="text-white">
                      Page ID <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="text"
                      value={config.pageId}
                      onChange={(e) => handleChange('pageId', e.target.value)}
                    placeholder="your-facebook-page-id"
                      className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                        errors.pageId ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.pageId && <p className="text-xs text-red-500">{errors.pageId}</p>}
                </div>
                      </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="mt-6 space-y-6">
              <div className="space-y-6">
                <div className="text-center py-12">
                  <p className="text-slate-400">Các tùy chọn nâng cao sẽ được thêm sau</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900">
          <Button
            variant="outline"
            onClick={checkConnection}
            disabled={checkingConnection}
            className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {checkingConnection ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
          </Button>
          <div className="flex items-center gap-3">
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
              {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
