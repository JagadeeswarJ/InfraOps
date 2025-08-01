import { useEffect } from "react"

// Notification Component
interface NotificationProps {
  type: 'success' | 'error'
  message: string
  isVisible: boolean
  onClose: () => void
}

const Notification = ({ type, message, isVisible, onClose }: NotificationProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000) // Auto dismiss after 4 seconds
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const successClasses = 'bg-white border-green-500 text-foreground'
  const errorClasses = 'bg-white border-red-500 text-destructive-foreground'
  const iconSuccess = '✓'
  const iconError = '✗'

  return (
    <div className={`fixed top-4 right-4 z-50 ${isVisible ? 'animate-in slide-in-from-right-4 duration-500' : 'animate-out slide-out-to-right-4 duration-300'}`}>
      <div className={`
        ${type === 'success' ? successClasses : errorClasses}
        border-l-4 rounded-md shadow-lg flex items-center space-x-3 min-w-[300px] max-w-md p-4
      `}>
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-lg
          ${type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
        `}>
          {type === 'success' ? iconSuccess : iconError}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm leading-relaxed">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors ml-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Notification;