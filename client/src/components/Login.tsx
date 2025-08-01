import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
// Import your background image
import loginBackground from "@/assets/images/login-background.png"

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

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500'
  const icon = type === 'success' ? '✓' : '✗'
  const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400'

  return (
    <div className={`fixed top-4 right-4 z-50 ${isVisible ? 'animate-in slide-in-from-right-4 duration-500' : 'animate-out slide-out-to-right-4 duration-300'}`}>
      <div className={`${bgColor} ${borderColor} border-l-4 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px] max-w-md`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} flex items-center justify-center text-white font-bold text-lg animate-pulse`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm leading-relaxed">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 text-white hover:text-gray-200 transition-colors ml-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function Login() {
  const [role, setRole] = useState("resident")
  const [step, setStep] = useState<"details" | "otp">("details")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    communityId: "",
    preferredLanguage: "English",
    expertise: [] as string[],
    currentExpertise: ""
  })
  const [otp, setOtp] = useState(["", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [showResend, setShowResend] = useState(false)
  
  // Notification states
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
    isVisible: boolean
  }>({
    type: 'success',
    message: '',
    isVisible: false
  })
  
  // Refs for OTP inputs for auto-focus
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const languages = ["English", "Telugu", "Tamil", "Hindi", "Kannada"]
  const expertiseOptions = [
    "Plumbing", "Electrical", "HVAC", "Carpentry", "Painting", 
    "Appliance Repair", "Landscaping", "General Maintenance", 
    "Security Systems", "Elevator Maintenance", "Fire Safety", "Pest Control"
  ]

  // Show notification function
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message, isVisible: true })
  }

  // Hide notification function
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }))
  }

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === "otp" && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    } else if (countdown === 0) {
      setShowResend(true)
    }
    return () => clearTimeout(timer)
  }, [countdown, step])

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addExpertise = (expertiseItem: string) => {
    if (expertiseItem && !formData.expertise.includes(expertiseItem)) {
      const updatedExpertise = [...formData.expertise, expertiseItem]
      handleInputChange("expertise", updatedExpertise)
      handleInputChange("currentExpertise", "")
    }
  }

  const removeExpertise = (expertiseToRemove: string) => {
    const updatedExpertise = formData.expertise.filter(item => item !== expertiseToRemove)
    handleInputChange("expertise", updatedExpertise)
  }

  const handleCustomExpertiseAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (formData.currentExpertise.trim()) {
        addExpertise(formData.currentExpertise.trim())
      }
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only allow digits
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take the last digit
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus()
    }
    
    // Auto-focus previous input on backspace
    if (!value && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phoneNumber.trim()) {
      showNotification('error', 'Please fill in all required fields')
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showNotification('error', 'Please enter a valid email address')
      setIsLoading(false)
      return
    }

    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      showNotification('error', 'Please enter a valid 10-digit phone number')
      setIsLoading(false)
      return
    }

    if (role === "maintenance" && formData.expertise.length === 0) {
      showNotification('error', 'Please add at least one area of expertise')
      setIsLoading(false)
      return
    }

    // Simulate sending OTP
    setTimeout(() => {
      setIsLoading(false)
      setStep("otp")
      setCountdown(30)
      setShowResend(false)
      // Focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
      showNotification('success', `OTP sent successfully to ${formData.phoneNumber}. Please check your messages.`)
    }, 1500)
  }

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("")
    
    if (enteredOtp.length !== 4) {
      showNotification('error', 'Please enter all 4 digits of the OTP')
      return
    }

    setIsLoading(true)
    
    // Simulate OTP verification (use "1234" as valid OTP for demo)
    setTimeout(() => {
      setIsLoading(false)
      if (enteredOtp === "1234") {
        showNotification('success', 'OTP verified successfully! Welcome to your dashboard.')
        // Here you would typically:
        // 1. Send final data to backend
        // 2. Handle successful login
        // 3. Redirect to dashboard
        console.log("Final submission data:", { role, ...formData })
        
        // Simulate redirect after successful login
        setTimeout(() => {
          // Redirect logic here
        }, 2000)
      } else {
        showNotification('error', 'Invalid OTP entered. Please check your messages and try again.')
        setOtp(["", "", "", ""])
        otpRefs.current[0]?.focus()
      }
    }, 1000)
  }

  const handleResendOtp = () => {
    setCountdown(30)
    setShowResend(false)
    setOtp(["", "", "", ""])
    showNotification('success', `New OTP sent to ${formData.phoneNumber}. It may take a moment to arrive.`)
    otpRefs.current[0]?.focus()
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Notification Component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      {/* Left Side - Building Image */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 relative overflow-hidden">
        <div 
          className="w-4/5 h-4/5 bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage: `url(${loginBackground})`,
          }}
        />
      </div>

      {/* Right Side - Form with Animation */}
      <div className="flex-1 flex items-center justify-center py-12 px-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === "details" ? "Welcome Back" : "Verify OTP"}
            </h1>
            <p className="text-gray-600">
              {step === "details" 
                ? "Sign in to your community platform" 
                : `Enter the 4-digit code sent to ${formData.phoneNumber}`
              }
            </p>
          </div>

          <Card className="border-gray-200 shadow-lg bg-white">
            <CardContent className="p-8">
              {/* Details Form */}
              {step === "details" && (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <form onSubmit={handleSubmitDetails} className="space-y-6">
                    {/* Role Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-gray-700 font-medium">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 transition-colors">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resident">Resident</SelectItem>
                          <SelectItem value="maintenance">Maintenance Staff</SelectItem>
                          <SelectItem value="administrator">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Form fields for Resident and Maintenance Staff */}
                    {(role === "resident" || role === "maintenance") && (
                      <>
                        {/* Name Field */}
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-700 font-medium">
                            Full Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 transition-colors"
                            maxLength={30}
                            required
                          />
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-700 font-medium">
                            Email Address <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 transition-colors"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            required
                          />
                        </div>

                        {/* Phone Number Field */}
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber" className="text-gray-700 font-medium">
                            Phone Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="10-digit phone number"
                            value={formData.phoneNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '')
                              if (value.length <= 10) {
                                handleInputChange("phoneNumber", value)
                              }
                            }}
                            className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 transition-colors"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            required
                          />
                        </div>

                        {/* Community ID Field (Only for Residents) */}
                        {role === "resident" && (
                          <div className="space-y-2">
                            <Label htmlFor="communityId" className="text-gray-700 font-medium">
                              Community ID <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                            </Label>
                            <Input
                              id="communityId"
                              type="text"
                              placeholder="Enter community ID if available"
                              value={formData.communityId}
                              onChange={(e) => handleInputChange("communityId", e.target.value)}
                              className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 transition-colors"
                            />
                          </div>
                        )}

                        {/* Expertise Field (Only for Maintenance Staff) */}
                        {role === "maintenance" && (
                          <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">
                              Areas of Expertise <span className="text-red-500">*</span>
                            </Label>
                            
                            {/* Selected Expertise Display */}
                            {formData.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border">
                                {formData.expertise.map((item, index) => (
                                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                                    {item}
                                    <button
                                      type="button"
                                      onClick={() => removeExpertise(item)}
                                      className="ml-2 hover:text-red-600"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Expertise Selection Dropdown */}
                            <Select onValueChange={addExpertise}>
                              <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="Select areas of expertise" />
                              </SelectTrigger>
                              <SelectContent>
                                {expertiseOptions.map((option) => (
                                  <SelectItem 
                                    key={option} 
                                    value={option}
                                    disabled={formData.expertise.includes(option)}
                                  >
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Custom Expertise Input */}
                            <Input
                              type="text"
                              placeholder="Or type custom expertise and press Enter"
                              value={formData.currentExpertise}
                              onChange={(e) => handleInputChange("currentExpertise", e.target.value)}
                              onKeyDown={handleCustomExpertiseAdd}
                              className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 transition-colors"
                            />
                            <p className="text-xs text-gray-500">Select from dropdown or type custom expertise and press Enter</p>
                          </div>
                        )}

                        {/* Preferred Language */}
                        <div className="space-y-2">
                          <Label htmlFor="language" className="text-gray-700 font-medium">
                            Preferred Language
                          </Label>
                          <Select 
                            value={formData.preferredLanguage} 
                            onValueChange={(value) => handleInputChange("preferredLanguage", value)}
                          >
                            <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 transition-colors">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang} value={lang}>
                                  {lang}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {/* Administrator Message */}
                    {role === "administrator" && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          Administrator login details will be configured separately.
                        </p>
                      </div>
                    )}

                    {/* Submit Button */}
                    {(role === "resident" || role === "maintenance") && (
                      <Button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 transition-colors" 
                        size="lg"
                      >
                        {isLoading ? "Sending OTP..." : "Continue"}
                      </Button>
                    )}
                  </form>
                </div>
              )}

              {/* OTP Form */}
              {step === "otp" && (
                <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
                  {/* OTP Input Fields */}
                  <div className="space-y-4">
                    <Label className="text-gray-700 font-medium text-center block">
                      Enter 4-Digit OTP
                    </Label>
                    <div className="flex justify-center gap-3">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => (otpRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-14 h-14 text-center text-xl font-mono border-gray-300 focus:border-blue-500 transition-colors"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Verify Button */}
                  <Button 
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otp.join("").length !== 4}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 transition-colors" 
                    size="lg"
                  >
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </Button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    {showResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        Resend OTP in {countdown}s
                      </p>
                    )}
                  </div>

                  {/* Back to form */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
                    >
                      ← Back to form
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500 mt-6">
            By signing in, you agree to our{" "}
            <Link to="#" className="underline hover:text-gray-700 transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="#" className="underline hover:text-gray-700 transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
