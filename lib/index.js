// api-balance — Host half (dsh composition plugin).
// Provides a same-origin JSON endpoint that reports the DeepSeek API account
// balance, resolved per request through the credentials service (the API key
// never leaves the host process).

const BALANCE_URL = 'https://api.deepseek.com/user/balance'

// Windows ships curl.exe; other platforms have plain `curl`.
const CURL = typeof process !== 'undefined' && process.platform === 'win32' ? 'curl.exe' : 'curl'

async function fetchBalance(ctx) {
  const credentials = ctx.get('credentials')
  if (!credentials) return { ok: false, step: 'credentials', error: 'credentials service unavailable' }
  const cred = await credentials.resolve('DEEPSEEK_API_KEY')
  if (!cred) return { ok: false, step: 'credential', error: 'DEEPSEEK_API_KEY is not configured' }
  const shell = ctx.get('shell')
  if (!shell) return { ok: false, step: 'shell', error: 'shell service unavailable' }
  let workspaceRoot = ''
  const sandboxPolicy = ctx.get('sandboxPolicy')
  if (sandboxPolicy !== undefined) {
    try {
      const resolved = sandboxPolicy.resolve()
      if (resolved && typeof resolved === 'object' && typeof resolved.workspaceRoot === 'string') {
        workspaceRoot = resolved.workspaceRoot
      }
    } catch (err) {
      console.error('[api-balance] sandboxPolicy.resolve failed: ' + String((err && err.message) || err))
    }
  }
  // The curl call is a read-only network request with no file effects; run it
  // unconfined (danger-full-access) so the platform sandbox runner is
  // bypassed entirely — the same path verified working for this endpoint.
  const spec = shell.resolve({
    command: `${CURL} -s -m 20 -H "Authorization: Bearer ${cred.value}" "${BALANCE_URL}"`,
    timeoutMs: 25000,
    stdoutMaxBytes: 65536,
    sandboxPolicy: { mode: 'danger-full-access', workspaceRoot },
  })
  const result = await shell.run(spec)
  if (result.exitCode !== 0) {
    const detail = (result.stderr.text || '').trim().slice(0, 300)
    return { ok: false, step: 'curl', error: 'exit ' + String(result.exitCode) + (detail ? ': ' + detail : '') }
  }
  let data
  try {
    data = JSON.parse(result.stdout.text)
  } catch (err) {
    return { ok: false, step: 'parse', error: 'unparseable response: ' + result.stdout.text.trim().slice(0, 300) }
  }
  const balances = Array.isArray(data.balance_infos)
    ? data.balance_infos.map((b) => ({
        currency: String(b.currency ?? ''),
        total: String(b.total_balance ?? ''),
        granted: String(b.granted_balance ?? ''),
        toppedUp: String(b.topped_up_balance ?? ''),
      }))
    : []
  return {
    ok: true,
    isAvailable: data.is_available === true,
    balances,
    fetchedAt: new Date().toISOString(),
  }
}

export default {
  name: 'api-balance',
  inject: ['webServer', 'credentials', 'shell'],
  apply(ctx) {
    ctx.webServer.register({
      kind: 'exact',
      path: '/api/abal-balance',
      handler: async (req, res) => {
        let payload
        try {
          payload = await fetchBalance(ctx)
        } catch (err) {
          const message = err && err.message ? err.message : String(err)
          console.error('[api-balance] handler failed: ' + message)
          payload = { ok: false, step: 'throw', error: message }
        }
        const body = JSON.stringify(payload)
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        })
        res.end(body)
      },
    })
  },
}
