export const showToast = (message, type = 'info', duration = 3000) => {
  try {
    if (typeof window === 'undefined' || !document) {
      // Not running in a browser environment
      console.log('Toast:', message)
      return
    }

    let container = document.getElementById('app-toasts')
    if (!container) {
      container = document.createElement('div')
      container.id = 'app-toasts'
      Object.assign(container.style, {
        position: 'fixed',
        right: '1rem',
        top: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 9999,
        pointerEvents: 'none',
      })
      document.body.appendChild(container)
    }

    const toast = document.createElement('div')
    toast.textContent = message
    Object.assign(toast.style, {
      background: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#111827',
      color: 'white',
      padding: '10px 14px',
      borderRadius: '8px',
      boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
      pointerEvents: 'auto',
      maxWidth: '320px',
      fontSize: '14px',
      opacity: '1',
      transition: 'opacity 300ms ease, transform 300ms ease',
      transform: 'translateY(0)',
    })

    container.appendChild(toast)

    // Auto-remove
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(-8px)'
      toast.addEventListener('transitionend', () => toast.remove(), { once: true })
    }, duration)
  } catch {
    // Fallback to console on any error
    console.log('Toast fallback:', message)
  }
}

export default showToast
