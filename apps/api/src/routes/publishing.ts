import { FastifyPluginAsync } from 'fastify'
import { q } from '../db.ts'
import { OAuthService, encrypt, decrypt } from '../services/publishing/oauth.ts'
import { PublishingOrchestrator } from '../services/publishing/orchestrator.ts'
import { WebhookManager, WEBHOOK_EVENTS } from '../services/publishing/webhooks.ts'
import { logEvent } from '../services/telemetry.ts'

const routes: FastifyPluginAsync = async (app) => {
    const orchestrator = new PublishingOrchestrator()
    const webhookManager = new WebhookManager()

    // OAuth authentication endpoints
    app.get('/auth/:platform', async (req: any, reply) => {
        const { platform } = req.params
        const userId = req.user_id || 'default_user' // In real app, get from auth

        // Handle API-key based platforms that don't use OAuth
        const apiKeyPlatforms = ['mailchimp', 'sendgrid']
        if (apiKeyPlatforms.includes(platform)) {
            // Check if credentials already exist
            const [existing] = await q(
                'SELECT platform, is_active FROM publishing_credentials WHERE user_id = $1 AND platform = $2',
                [userId, platform]
            )
            
            if (existing && existing.is_active) {
                return { 
                    ok: true, 
                    message: `${platform} is already configured with API key`,
                    already_configured: true 
                }
            } else {
                return reply.status(400).send({
                    ok: false,
                    error: `${platform} requires API key configuration. Please contact administrator.`,
                    requires_api_key: true
                })
            }
        }

        try {
            const authUrl = await OAuthService.getAuthUrl(platform, userId)
            return { auth_url: authUrl }
        } catch (error) {
            return reply.status(400).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Authentication failed'
            })
        }
    })

    app.post('/auth/:platform/callback', async (req: any, reply) => {
        const { platform } = req.params
        const { code, state } = req.body
        const userId = req.user_id || 'default_user'

        try {
            const credentials = await OAuthService.exchangeCode(platform, code, state, userId)
            return { ok: true, credentials }
        } catch (error) {
            return reply.status(400).send({
                ok: false,
                error: error instanceof Error ? error.message : 'OAuth callback failed'
            })
        }
    })

    app.get('/auth/:platform/callback', async (req: any, reply) => {
        const { platform } = req.params
        const { code, state } = req.query
        const userId = req.user_id || 'default_user'

        console.log('OAuth callback received:', { platform, code: code?.substring(0, 10) + '...', state: state?.substring(0, 10) + '...', userId })

        try {
            const credentials = await OAuthService.exchangeCode(platform, code, state, userId)
            console.log('OAuth exchange successful:', { platform, userId, credentialId: credentials.credential_id })
            return reply.type('text/html').send(`
                <html>
                    <body>
                        <h2>Authentication Successful!</h2>
                        <p>You have successfully connected your ${platform} account.</p>
                        <script>
                            window.close();
                            if (window.opener) {
                                window.opener.postMessage({type: 'oauth_success', platform: '${platform}'}, '*');
                            }
                        </script>
                    </body>
                </html>
            `)
        } catch (error) {
            return reply.type('text/html').send(`
                <html>
                    <body>
                        <h2>Authentication Failed</h2>
                        <p>Error: ${error instanceof Error ? error.message : 'OAuth callback failed'}</p>
                        <script>window.close();</script>
                    </body>
                </html>
            `)
        }
    })

    // Publishing endpoints
    app.post('/publish', async (req: any, reply) => {
        const { pack_id, platforms, content, scheduled_at } = req.body

        if (!pack_id || !platforms || !Array.isArray(platforms)) {
            return reply.status(400).send({
                ok: false,
                error: 'pack_id and platforms array are required'
            })
        }

        try {
            if (scheduled_at) {
                await orchestrator.schedulePublishing(pack_id, platforms, content, new Date(scheduled_at))
                return { ok: true, message: 'Publishing scheduled' }
            } else {
                await orchestrator.publishPack(pack_id, platforms, content)
                return { ok: true, message: 'Publishing started' }
            }
        } catch (error) {
            console.error('Publishing error:', error)
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Publishing failed'
            })
        }
    })

    app.get('/status/:pack_id', async (req: any, reply) => {
        const { pack_id } = req.params

        try {
            const status = await orchestrator.getPublishingStatus(pack_id)
            return { ok: true, status }
        } catch (error) {
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to get status'
            })
        }
    })

    app.post('/retry/:pack_id', async (req: any, reply) => {
        const { pack_id } = req.params

        try {
            await orchestrator.retryFailedJobs()
            return { ok: true, message: 'Retry jobs started' }
        } catch (error) {
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Retry failed'
            })
        }
    })

    // Webhook management
    app.post('/webhooks', async (req: any, reply) => {
        const { name, url, secret, events, headers } = req.body
        const userId = req.user_id || 'default_user'

        if (!name || !url || !secret || !events) {
            return reply.status(400).send({
                ok: false,
                error: 'name, url, secret, and events are required'
            })
        }

        try {
            await webhookManager.register({
                webhook_id: '',
                user_id: userId,
                name,
                url,
                secret,
                events,
                headers,
                is_active: true
            })

            return { ok: true, message: 'Webhook registered' }
        } catch (error) {
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Webhook registration failed'
            })
        }
    })

    app.get('/webhooks', async (req: any, reply) => {
        const userId = req.user_id || 'default_user'

        try {
            const webhooks = await q(`
                SELECT webhook_id, name, url, events, is_active, created_at
                FROM webhook_configurations 
                WHERE user_id = $1
                ORDER BY created_at DESC
            `, [userId])

            return { ok: true, webhooks }
        } catch (error) {
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to get webhooks'
            })
        }
    })

    app.delete('/webhooks/:webhook_id', async (req: any, reply) => {
        const { webhook_id } = req.params
        const userId = req.user_id || 'default_user'

        try {
            await q(`
                UPDATE webhook_configurations 
                SET is_active = false, updated_at = NOW()
                WHERE webhook_id = $1 AND user_id = $2
            `, [webhook_id, userId])

            return { ok: true, message: 'Webhook deactivated' }
        } catch (error) {
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to deactivate webhook'
            })
        }
    })

    // Platform credentials management
    app.get('/credentials', async (req: any, reply) => {
        const userId = req.user_id || 'default_user'

        try {
            const credentials = await q(`
                SELECT platform, credential_type, is_active, expires_at, created_at
                FROM publishing_credentials 
                WHERE user_id = $1
                ORDER BY platform
            `, [userId])

            return { ok: true, credentials }
        } catch (error) {
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to get credentials'
            })
        }
    })

    app.get('/credentials/mailchimp/config', async (req: any, reply) => {
        const userId = req.user_id || 'default_user'

        try {
            const [credential] = await q(
                'SELECT encrypted_credentials FROM publishing_credentials WHERE user_id = $1 AND platform = $2 AND is_active = true',
                [userId, 'mailchimp']
            )

            if (credential && credential.encrypted_credentials) {
                const config = typeof credential.encrypted_credentials === 'string' 
                    ? JSON.parse(credential.encrypted_credentials) 
                    : credential.encrypted_credentials

                return { ok: true, config }
            } else {
                return { ok: false, message: 'No MailChimp configuration found' }
            }
        } catch (error) {
            console.error('Load MailChimp config error:', error)
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to load configuration'
            })
        }
    })

    app.post('/credentials/mailchimp', async (req: any, reply) => {
        const { apiKey, serverPrefix, listId, fromName, fromEmail, replyToEmail } = req.body
        const userId = req.user_id || 'default_user'

        if (!apiKey || !serverPrefix || !listId || !fromName || !fromEmail || !replyToEmail) {
            return reply.status(400).send({
                ok: false,
                error: 'All MailChimp configuration fields are required'
            })
        }

        try {
            // Store encrypted credentials
            const encryptedCredentials = {
                apiKey,
                serverPrefix,
                listId,
                fromName,
                fromEmail,
                replyToEmail
            }

            // Check if credentials already exist
            const [existing] = await q(
                'SELECT credential_id FROM publishing_credentials WHERE user_id = $1 AND platform = $2',
                [userId, 'mailchimp']
            )

            if (existing) {
                // Update existing
                await q(`
                    UPDATE publishing_credentials 
                    SET encrypted_credentials = $1, is_active = $2, updated_at = NOW()
                    WHERE user_id = $3 AND platform = $4
                `, [JSON.stringify(encryptedCredentials), true, userId, 'mailchimp'])
            } else {
                // Insert new
                const { randomUUID } = await import('crypto')
                const credentialId = randomUUID()
                await q(`
                    INSERT INTO publishing_credentials (
                        credential_id, user_id, platform, credential_type, 
                        encrypted_credentials, is_active, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                `, [credentialId, userId, 'mailchimp', 'api_key', JSON.stringify(encryptedCredentials), true])
            }

            await logEvent({
                event_type: 'publishing.credentials_updated',
                actor_id: userId,
                actor_role: 'user',
                payload: { platform: 'mailchimp' }
            })

            return { ok: true, message: 'MailChimp credentials saved successfully' }
        } catch (error) {
            console.error('Save MailChimp credentials error:', error)
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to save credentials'
            })
        }
    })

    // Facebook configuration endpoints
    app.get('/credentials/facebook/pages', async (req: any, reply) => {
        const userId = req.user_id || 'default_user'

        try {
            // Get Facebook OAuth credentials
            const credentials = await OAuthService.getCredentials(userId, 'facebook')
            const accessToken = credentials.access_token

            if (!accessToken) {
                return reply.status(400).send({
                    ok: false,
                    error: 'Facebook OAuth credentials not found. Please connect your Facebook account first.'
                })
            }

            // Fetch pages from Facebook Graph API
            const response = await fetch(
                `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token`
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Failed to fetch pages' } }))
                return reply.status(400).send({
                    ok: false,
                    error: errorData.error?.message || 'Failed to fetch Facebook pages'
                })
            }

            const data = await response.json()
            const pages = (data.data || []).map((page: any) => ({
                id: page.id,
                name: page.name,
                access_token: page.access_token
            }))

            return { ok: true, pages }
        } catch (error) {
            console.error('Fetch Facebook pages error:', error)
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to fetch Facebook pages'
            })
        }
    })

    app.get('/credentials/facebook/config', async (req: any, reply) => {
        const userId = req.user_id || 'default_user'

        try {
            const [credential] = await q(
                'SELECT encrypted_credentials FROM publishing_credentials WHERE user_id = $1 AND platform = $2 AND is_active = true',
                [userId, 'facebook']
            )

            if (credential && credential.encrypted_credentials) {
                // Check if it's OAuth credentials or config
                const creds = typeof credential.encrypted_credentials === 'string' 
                    ? JSON.parse(credential.encrypted_credentials) 
                    : credential.encrypted_credentials

                // Decrypt if encrypted
                let decryptedCreds
                if (creds.encrypted) {
                    try {
                        const decrypted = decrypt(creds.encrypted)
                        decryptedCreds = JSON.parse(decrypted)
                    } catch (e) {
                        // If decryption fails, try using creds directly
                        decryptedCreds = creds
                    }
                } else {
                    decryptedCreds = creds
                }

                // Return all config fields
                    return { 
                        ok: true, 
                        config: {
                        configName: decryptedCreds.configName || '',
                        defaultHashtags: decryptedCreds.defaultHashtags || '',
                        timezone: decryptedCreds.timezone || '',
                        appId: decryptedCreds.appId || '',
                        appSecret: decryptedCreds.appSecret || '',
                        pageAccessToken: decryptedCreds.pageAccessToken || '',
                        pageId: decryptedCreds.pageId || decryptedCreds.page_id || '',
                            pageName: decryptedCreds.pageName || decryptedCreds.page_name || '',
                            enableLinkPreview: decryptedCreds.enableLinkPreview ?? decryptedCreds.enable_link_preview ?? true,
                            defaultScheduling: decryptedCreds.defaultScheduling || decryptedCreds.default_scheduling || 'immediate'
                        }
                }
            } else {
                return { ok: false, message: 'No Facebook credentials found' }
            }
        } catch (error) {
            console.error('Load Facebook config error:', error)
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to load configuration'
            })
        }
    })

    app.post('/credentials/facebook', async (req: any, reply) => {
        const { 
            configName, 
            defaultHashtags, 
            timezone, 
            appId, 
            appSecret, 
            pageAccessToken, 
            pageId, 
            pageName, 
            enableLinkPreview, 
            defaultScheduling 
        } = req.body
        const userId = req.user_id || 'default_user'

        // Log received data for debugging (without sensitive info)
        console.log('Facebook config save request:', {
            configName,
            defaultHashtags,
            timezone,
            appId: appId ? '***' : undefined,
            appSecret: appSecret ? '***' : undefined,
            pageAccessToken: pageAccessToken ? '***' : undefined,
            pageId,
            pageName,
            enableLinkPreview,
            defaultScheduling
        })

        // Validate required fields with detailed error messages
        const missingFields: string[] = []
        if (!configName || (typeof configName === 'string' && configName.trim() === '')) {
            missingFields.push('Config Name')
        }
        if (!appId || (typeof appId === 'string' && appId.trim() === '')) {
            missingFields.push('App ID')
        }
        if (!appSecret || (typeof appSecret === 'string' && appSecret.trim() === '')) {
            missingFields.push('App Secret')
        }
        if (!pageAccessToken || (typeof pageAccessToken === 'string' && pageAccessToken.trim() === '')) {
            missingFields.push('Page Access Token')
        }
        if (!pageId || (typeof pageId === 'string' && pageId.trim() === '')) {
            missingFields.push('Page ID')
        }

        if (missingFields.length > 0) {
            console.error('Validation failed - missing fields:', missingFields)
            return reply.status(400).send({
                ok: false,
                error: `Missing required fields: ${missingFields.join(', ')}`,
                missingFields
            })
        }

        try {
            // Prepare credentials data
            const credentialsData = {
                configName: configName.trim(),
                defaultHashtags: defaultHashtags || '',
                timezone: timezone || '',
                appId: appId.trim(),
                appSecret: appSecret.trim(),
                pageAccessToken: pageAccessToken.trim(),
                pageId: pageId.trim(),
                pageName: pageName || '',
                enableLinkPreview: enableLinkPreview ?? true,
                defaultScheduling: defaultScheduling || 'immediate'
            }

            // Encrypt credentials
            const encryptedConfig = encrypt(JSON.stringify(credentialsData))
            const encryptedJson = JSON.stringify({ encrypted: encryptedConfig })

            // Check if credentials already exist
            const [existing] = await q(
                'SELECT credential_id FROM publishing_credentials WHERE user_id = $1 AND platform = $2',
                [userId, 'facebook']
            )

            if (existing) {
                // Update existing credentials
            await q(`
                UPDATE publishing_credentials 
                    SET encrypted_credentials = $1, is_active = $2, updated_at = NOW()
                    WHERE user_id = $3 AND platform = $4
                `, [encryptedJson, true, userId, 'facebook'])
            } else {
                // Insert new credentials
                const { randomUUID } = await import('crypto')
                const credentialId = randomUUID()
                await q(`
                    INSERT INTO publishing_credentials (
                        credential_id, user_id, platform, credential_type, 
                        encrypted_credentials, is_active, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                `, [credentialId, userId, 'facebook', 'api_key', encryptedJson, true])
            }

            await logEvent({
                event_type: 'publishing.credentials_updated',
                actor_id: userId,
                actor_role: 'user',
                payload: { platform: 'facebook', config: true }
            })

            return { ok: true, message: 'Facebook credentials saved successfully' }
        } catch (error) {
            console.error('Save Facebook credentials error:', error)
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to save credentials'
            })
        }
    })

    app.delete('/credentials/:platform', async (req: any, reply) => {
        const { platform } = req.params
        const userId = req.user_id || 'default_user'

        try {
            await OAuthService.revokeCredentials(userId, platform)
            return { ok: true, message: 'Credentials revoked' }
        } catch (error) {
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to revoke credentials'
            })
        }
    })

    // Test webhook endpoint (for development)
    app.post('/test/webhook', async (req: any, reply) => {
        const { event_type, payload } = req.body

        if (!event_type) {
            return reply.status(400).send({
                ok: false,
                error: 'event_type is required'
            })
        }

        try {
            await webhookManager.trigger(event_type, payload || {})
            return { ok: true, message: 'Webhook triggered' }
        } catch (error) {
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Webhook trigger failed'
            })
        }
    })

    // Publishing analytics
    app.get('/analytics/:pack_id', async (req: any, reply) => {
        const { pack_id } = req.params

        try {
            const analytics = await q(`
                SELECT 
                    pr.platform,
                    pr.external_id,
                    pr.external_url,
                    pr.metrics,
                    pr.published_at,
                    pq.status,
                    pq.error_message
                FROM publishing_results pr
                JOIN publishing_queue pq ON pr.queue_id = pq.queue_id
                WHERE pq.pack_id = $1
                ORDER BY pr.published_at DESC
            `, [pack_id])

            return { ok: true, analytics }
        } catch (error) {
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to get analytics'
            })
        }
    })

    // Platform-specific content formatting
    app.post('/format/:platform', async (req: any, reply) => {
        const { platform } = req.params
        const { content } = req.body

        if (!content) {
            return reply.status(400).send({
                ok: false,
                error: 'content is required'
            })
        }

        try {
            const formatted = orchestrator['formatContentForPlatform'](platform, content)
            return { ok: true, formatted }
        } catch (error) {
            return reply.status(500).send({
                ok: false,
                error: error instanceof Error ? error.message : 'Content formatting failed'
            })
        }
    })

    // Khởi động worker xử lý các job đã schedule (pending, tới hạn)
    orchestrator.startScheduledWorker?.()
}

export default routes

