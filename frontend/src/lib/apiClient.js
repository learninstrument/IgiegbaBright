const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '')

const isLocalOrigin = (origin = '') => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)

const getConfiguredOrigins = () => {
  const rawValue = import.meta.env.VITE_API_URL || ''
  return rawValue
    .split(',')
    .map(origin => trimTrailingSlash(origin.trim()))
    .filter(Boolean)
}

const getRuntimeOrigin = () => {
  if (typeof window === 'undefined') return ''
  return trimTrailingSlash(window.location.origin || '')
}

const unique = (items) => [...new Set(items)]

const buildApiUrl = (origin, path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!origin) return `/api${normalizedPath}`
  return `${origin}/api${normalizedPath}`
}

const isHtmlResponse = (response) => {
  const contentType = response.headers.get('content-type') || ''
  return contentType.includes('text/html')
}

const getApiOrigins = () => {
  const configuredOrigins = getConfiguredOrigins()
  const runtimeOrigin = getRuntimeOrigin()
  const shouldDropLocalhostConfigs = runtimeOrigin && !isLocalOrigin(runtimeOrigin)

  const prioritizedConfigured = shouldDropLocalhostConfigs
    ? configuredOrigins.filter(origin => !isLocalOrigin(origin))
    : configuredOrigins

  const candidates = unique([...prioritizedConfigured, runtimeOrigin, ''])
  return candidates.length > 0 ? candidates : ['']
}

export const fetchApi = async (path, options = {}) => {
  let lastError = new Error('Unable to reach API')

  for (const origin of getApiOrigins()) {
    const endpoint = buildApiUrl(origin, path)

    try {
      const response = await fetch(endpoint, {
        cache: 'no-store',
        ...options
      })

      if (isHtmlResponse(response)) {
        lastError = new Error(`Invalid API response from ${endpoint}`)
        continue
      }

      return response
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}
