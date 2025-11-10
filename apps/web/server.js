// Wrapper script to start Next.js standalone server with custom port
const { spawn } = require('child_process')
const path = require('path')

const PORT = process.env.PORT || 3000
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0'

console.log(`🌐 Starting Next.js server on ${HOSTNAME}:${PORT}`)

// Set environment variables for the standalone server
process.env.PORT = PORT
process.env.HOSTNAME = HOSTNAME

// Start the standalone server
require('./.next/standalone/server.js')

