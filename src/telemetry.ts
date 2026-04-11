// StoryWalk G2 — lightweight telemetry shim. Silent in production.
// Self-initializes global error listeners on import.

const APP_NAME = 'storywalk'
const APP_VERSION = '0.1.0'

export function reportError(message: string, stack?: string): void {
  // Telemetry backend is optional. We just log to console.
  console.warn(`[telemetry ${APP_NAME}@${APP_VERSION}] ${message}`, stack ?? '')
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    reportError(event.message, event.error?.stack)
  })
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { message?: string; stack?: string } | undefined
    reportError(
      `Unhandled rejection: ${reason?.message ?? String(event.reason)}`,
      reason?.stack,
    )
  })
}
