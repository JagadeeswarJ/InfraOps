import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { api, TOKEN_STORE } from "@/utils/api"
import { Loader2 } from "lucide-react"
// Import your background image
import Notification from "@/components/ui/notification"
import loginBackground from "@/assets/images/login-background.png"

interface Community {
  id: string
  name: string
  location: string
  isActive: boolean
}

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [role, setRole] = useState("resident")
  const [step, setStep] = useState<"details" | "otp">("details")
  const [communities, setCommunities] = useState<Community[]>([])
  const [communitiesLoading, setCommunitiesLoading] = useState(false)
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    communityId: "",
    expertise: [] as string[],
    currentExpertise: ""
  })
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
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

  // Fetch communities
  const fetchCommunities = async () => {
    setCommunitiesLoading(true)
    try {
      const response = await api.get('/api/communities?isActive=true')
      if (response.data.success) {
        setCommunities(response.data.communities)
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
      showNotification('error', 'Failed to load communities')
    } finally {
      setCommunitiesLoading(false)
    }
  }

  // Load communities when component mounts
  useEffect(() => {
    fetchCommunities()
  }, [])

  // Helper function to get redirect URL based on user role
  const getRedirectUrl = (userRole: string) => {
    switch (userRole) {
      case 'manager':
        return '/dashboard'
      case 'resident':
        return '/user-dashboard'
      case 'technician':
        return '/technician-dashboard'
      default:
        return '/dashboard'
    }
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

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log(loginData)
      const response = await api.post('/auth/login', loginData)
      console.log(response.data)
      if (response.data.success) {
        localStorage.setItem(TOKEN_STORE, response.data.token)
        showNotification('success', 'Login successful! Welcome back.')
        // Redirect based on user role
        const userRole = response.data.user?.role || 'resident'
        const redirectUrl = getRedirectUrl(userRole)
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 1500)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.'
      showNotification('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
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
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
    
    // Auto-focus previous input on backspace
    if (!value && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }

    // Auto-submit when all 6 digits are filled
    if (value && newOtp.every(digit => digit !== '') && !isLoading) {
      // Use setTimeout to ensure the state is updated and UI is rendered
      setTimeout(() => {
        handleVerifyOtp()
      }, 100)
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
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.phone.trim()) {
      showNotification('error', 'Please fill in all required fields')
      setIsLoading(false)
      return
    }

    // Community is required for residents
    if (role === "resident" && !formData.communityId) {
      showNotification('error', 'Please select a community')
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showNotification('error', 'Please enter a valid email address')
      setIsLoading(false)
      return
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      showNotification('error', 'Please enter a valid 10-digit phone number')
      setIsLoading(false)
      return
    }

    if (role === "technician" && formData.expertise.length === 0) {
      showNotification('error', 'Please add at least one area of expertise')
      setIsLoading(false)
      return
    }

    try {
      // Prepare data for the server API
      const registrationPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role,
        expertise: role === "technician" ? formData.expertise : undefined,
        communityId: formData.communityId || undefined,
      };

      const response = await api.post('/auth/register', registrationPayload);
      
      if (response.data.success) {
        setStep("otp")
        setCountdown(30)
        setShowResend(false)
        // Focus first OTP input
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
        showNotification('success', `OTP sent successfully to ${formData.email}. Please check your email.`)
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.'
      showNotification('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("")
    
    if (enteredOtp.length !== 6) {
      showNotification('error', 'Please enter all 6 digits of the OTP')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await api.post('/auth/verify-otp', {
        email: formData.email,
        otp: enteredOtp
      });
      
      if (response.data.success) {
        // Store the token for automatic login
        if (response.data.token) {
          localStorage.setItem(TOKEN_STORE, response.data.token)
          showNotification('success', 'Account created and logged in successfully! Welcome!')
          // Redirect based on user role
          const userRole = response.data.user?.role || role
          const redirectUrl = getRedirectUrl(userRole)
          setTimeout(() => {
            window.location.href = redirectUrl
          }, 1500)
        } else {
          showNotification('success', 'OTP verified successfully! Account created. Please sign in.')
          // Reset form and go back to login
          setTimeout(() => {
            setMode("login")
            setStep("details")
            setOtp(["", "", "", "", "", ""])
            setFormData({
              name: "",
              email: "",
              password: "",
              phone: "",
              communityId: "",
              expertise: [] as string[],
              currentExpertise: ""
            })
          }, 2000)
        }
      }
    } catch (error: any) {
      console.error('OTP verification error:', error)
      const errorMessage = error.response?.data?.error || 'Invalid OTP. Please try again.'
      showNotification('error', errorMessage)
      setOtp(["", "", "", "", "", ""])
      otpRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = () => {
    setCountdown(30)
    setShowResend(false)
    setOtp(["", "", "", "", "", ""])
    showNotification('success', `New OTP sent to ${formData.email}. It may take a moment to arrive.`)
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
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 relative overflow-hidden">
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
              {mode === "login" ? "Welcome Back" : (step === "details" ? "Create Account" : "Verify OTP")}
            </h1>
            <p className="text-gray-600">
              {mode === "login" 
                ? "Sign in to your account" 
                : (step === "details" 
                  ? "Create your community platform account" 
                  : `Enter the 6-digit code sent to ${formData.email}`
                )
              }
            </p>
          </div>

          <Card className="border-gray-200 shadow-lg bg-white">
            <CardContent className="p-8">
              {/* Login Form */}
              {mode === "login" && (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <form onSubmit={handleLogin} className="space-y-6">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="loginEmail" className="text-gray-700 font-medium">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        placeholder="name@example.com"
                        value={loginData.email}
                        onChange={(e) => handleLoginInputChange("email", e.target.value)}
                        className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        required
                      />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="loginPassword" className="text-gray-700 font-medium">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="loginPassword"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => handleLoginInputChange("password", e.target.value)}
                        className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors"
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    {/* Login Button */}
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 transition-colors" 
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    {/* Switch to Register */}
                    <div className="text-center">
                      <p className="text-gray-600 text-sm">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setMode("register")}
                          className="text-gray-900 hover:text-gray-700 font-medium transition-colors"
                        >
                          Create account
                        </button>
                      </p>
                    </div>
                  </form>
                </div>
              )}

              {/* Registration Details Form */}
              {mode === "register" && step === "details" && (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <form onSubmit={handleSubmitDetails} className="space-y-6">
                    {/* Role Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-gray-700 font-medium">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resident">Resident</SelectItem>
                          <SelectItem value="technician">Technician</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Form fields for Resident, Technician, and Manager */}
                    {(role === "resident" || role === "technician" || role === "manager") && (
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
                            className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors"
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
                            className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            required
                          />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-gray-700 font-medium">
                            Password <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors"
                            autoComplete="new-password"
                            required
                          />
                        </div>

                        {/* Phone Number Field */}
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-gray-700 font-medium">
                            Phone Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="10-digit phone number"
                            value={formData.phone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '')
                              if (value.length <= 10) {
                                handleInputChange("phone", value)
                              }
                            }}
                            className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            required
                          />
                        </div>

                        {/* Community Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="communityId" className="text-gray-700 font-medium">
                            Community {role === "resident" ? <span className="text-red-500">*</span> : <span className="text-gray-500 text-sm font-normal">(Optional)</span>}
                          </Label>
                          <Select 
                            value={formData.communityId} 
                            onValueChange={(value) => handleInputChange("communityId", value)}
                            disabled={communitiesLoading}
                          >
                            <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors">
                              <SelectValue placeholder={
                                communitiesLoading 
                                  ? "Loading communities..." 
                                  : communities.length === 0
                                    ? "No communities available"
                                    : role === "resident"
                                      ? "Select your community"
                                      : "Select community (optional)"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {communities.map((community) => (
                                <SelectItem key={community.id} value={community.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{community.name}</span>
                                    <span className="text-xs text-gray-500">{community.location}</span>
                                  </div>
                                </SelectItem>
                              ))}
                              {communities.length === 0 && !communitiesLoading && (
                                <SelectItem value="" disabled>
                                  No communities available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          
                          {communitiesLoading && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Loading communities...
                            </div>
                          )}
                          
                          {communities.length === 0 && !communitiesLoading && (
                            <div className="text-xs text-gray-500">
                              No communities found. Please contact support if you need to create a community.
                            </div>
                          )}
                        </div>

                        {/* Expertise Field (Only for Technicians) */}
                        {role === "technician" && (
                          <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">
                              Areas of Expertise <span className="text-red-500">*</span>
                            </Label>
                            
                            {/* Selected Expertise Display */}
                            {formData.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border">
                                {formData.expertise.map((item, index) => (
                                  <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800 px-3 py-1">
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
                              <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors">
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
                              className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors"
                            />
                            <p className="text-xs text-gray-500">Select from dropdown or type custom expertise and press Enter</p>
                          </div>
                        )}

                      </>
                    )}


                    {/* Submit Button */}
                    {(role === "resident" || role === "technician" || role === "manager") && (
                      <Button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 transition-colors" 
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending OTP...
                          </>
                        ) : (
                          "Continue"
                        )}
                      </Button>
                    )}

                    {/* Switch to Login */}
                    <div className="text-center">
                      <p className="text-gray-600 text-sm">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setMode("login")}
                          className="text-gray-900 hover:text-gray-700 font-medium transition-colors"
                        >
                          Sign in
                        </button>
                      </p>
                    </div>
                  </form>
                </div>
              )}

              {/* OTP Form */}
              {step === "otp" && (
                <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
                  {/* OTP Input Fields */}
                  <div className="space-y-4">
                    <Label className="text-gray-700 font-medium text-center block">
                      Enter 6-Digit OTP
                    </Label>
                    <div className="flex justify-center gap-3">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => {
                            otpRefs.current[index] = el
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-14 h-14 text-center text-xl font-mono border-gray-300 focus:border-gray-900 transition-colors"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Verify Button */}
                  <Button 
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otp.join("").length !== 6}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 transition-colors" 
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    {showResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-gray-900 hover:text-gray-700 text-sm font-medium transition-colors"
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
