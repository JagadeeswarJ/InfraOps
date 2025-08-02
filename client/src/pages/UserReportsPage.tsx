import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  MapPin, 
  Calendar, 
  Search, 
  Filter, 
  TrendingUp, 
  Upload, 
  X, 
  ImageIcon,
  Eye,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Bell
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"

// TypeScript Interfaces
interface Ticket {
  id?: string
  title: string
  description: string
  imageUrl?: string[]
  reportedBy: string
  assignedTo?: string
  category: string
  location: string
  priority: 'low' | 'medium' | 'high' | 'auto'
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'spam'
  communityId: string
  createdAt?: any
  updatedAt?: any
  reporter?: {
    name: string
    id: string
  }
  assignedTechnician?: {
    name: string
    id: string
    expertise: string[]
  }
  aiMetadata?: {
    predictedCategory?: string
    predictedUrgency?: 'low' | 'high'
    confidence?: number
  }
  requiredTools?: Array<{
    name: string
    category: string
    estimated_cost: string
    required: boolean
    alternatives: string[]
  }>
  requiredMaterials?: Array<{
    name: string
    quantity: string
    unit: string
    estimated_cost: string
    required: boolean
    alternatives: string[]
  }>
  estimatedDuration?: string
  difficultyLevel?: string
}

interface TicketStats {
  total: number
  open: number
  assigned: number
  in_progress: number
  resolved: number
  closed: number
}

// Notification Component
interface NotificationProps {
  type: 'success' | 'error' | 'info'
  message: string
  isVisible: boolean
  onClose: () => void
}

const Notification = ({ type, message, isVisible, onClose }: NotificationProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const styles = {
    success: { bg: 'bg-green-500', border: 'border-green-400', icon: <CheckCircle size={20} /> },
    error: { bg: 'bg-red-500', border: 'border-red-400', icon: <AlertCircle size={20} /> },
    info: { bg: 'bg-blue-500', border: 'border-blue-400', icon: <AlertCircle size={20} /> }
  }
  
  const style = styles[type]

  return (
    <div className={`fixed top-4 right-4 z-50 animate-in slide-in-from-right-4 duration-500`}>
      <div className={`${style.bg} ${style.border} border-l-4 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[350px] max-w-md`}>
        <div className="flex-shrink-0">
          {style.icon}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm leading-relaxed">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 text-white hover:text-gray-200 transition-colors ml-2"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// Categories available in the backend
const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'maintenance', label: 'General Maintenance' },
  { value: 'security', label: 'Security' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'fire_safety', label: 'Fire Safety' },
  { value: 'pest_control', label: 'Pest Control' }
]

// Ticket Service
class TicketService {
  static async createTicket(ticketData: Partial<Ticket>): Promise<{ success: boolean; ticketId: string; ticket: Ticket; message: string }> {
    const response = await api.post('/api/tickets', ticketData)
    return response.data
  }

  static async getUserTickets(userId: string): Promise<Ticket[]> {
    const response = await api.get('/api/tickets', { 
      params: { reportedBy: userId } 
    })
    return response.data.tickets || []
  }

  static async getCommunityTickets(communityId: string): Promise<Ticket[]> {
    const response = await api.get('/api/tickets', { 
      params: { communityId } 
    })
    return response.data.tickets || []
  }

  static async getTicketStats(communityId?: string): Promise<TicketStats> {
    const params = communityId ? { communityId } : {}
    const response = await api.get('/api/tickets/stats', { params })
    return response.data.stats || {
      total: 0,
      open: 0,
      assigned: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    }
  }

  static async uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images', file)
    })
    
    const response = await api.post('/api/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data.data.map((result: any) => result.url)
  }
}

// Helper functions
const generateTitleFromDescription = (description: string) => {
  return description.length > 50 ? description.substring(0, 50) + '...' : description
}

const formatDate = (dateString: any) => {
  if (!dateString) return 'Unknown'
  
  let date: Date
  if (dateString.toDate) {
    // Firestore timestamp
    date = dateString.toDate()
  } else if (dateString._seconds) {
    // Firestore timestamp object
    date = new Date(dateString._seconds * 1000)
  } else {
    date = new Date(dateString)
  }
  
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = diffInMs / (1000 * 60 * 60)
  const diffInDays = diffInHours / 24

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
  if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

// Helper function to format file size (currently unused but may be needed for future features)
// const formatFileSize = (bytes: number): string => {
//   if (bytes === 0) return '0 Bytes'
//   const k = 1024
//   const sizes = ['Bytes', 'KB', 'MB', 'GB']
//   const i = Math.floor(Math.log(bytes) / Math.log(k))
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
// }

export function UserReportsPage() {
  const { user } = useAuth()
  
  // State for tickets
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [communityTickets, setCommunityTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "",
    priority: "auto" as "auto" | "low" | "medium" | "high",
    imageFiles: [] as File[],
    imagePreviews: [] as string[]
  })
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
    isVisible: boolean
  }>({
    type: 'success',
    message: '',
    isVisible: false
  })

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("recent")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Show notification function
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, isVisible: true })
  }

  // Hide notification function
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }))
  }

  // Load data from backend
  const loadData = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Load user's tickets
      const userTickets = await TicketService.getUserTickets(user.id!)
      setMyTickets(userTickets)
      
      // Load community tickets if user has communityId
      if (user.communityId) {
        const communityTickets = await TicketService.getCommunityTickets(user.communityId)
        setCommunityTickets(communityTickets)
        
        // Load statistics
        const ticketStats = await TicketService.getTicketStats(user.communityId)
        setStats(ticketStats)
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      showNotification('error', 'Failed to load tickets. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle multiple image uploads
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        showNotification('error', `${file.name} is not a valid image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', `${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          imageFiles: [...prev.imageFiles, file],
          imagePreviews: [...prev.imagePreviews, e.target?.result as string]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }))
  }

  // Validate form
  const validateForm = () => {
    if (!formData.description.trim()) {
      showNotification('error', 'Please provide a description of the problem')
      return false
    }

    if (!formData.location.trim()) {
      showNotification('error', 'Please specify the location of the issue')
      return false
    }

    if (!user?.communityId) {
      showNotification('error', 'Community ID is required')
      return false
    }

    return true
  }

  // Handle ticket submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Upload images first if any
      let imageUrls: string[] = []
      if (formData.imageFiles.length > 0) {
        setIsUploading(true)
        showNotification('info', 'Uploading images...')
        
        try {
          imageUrls = await TicketService.uploadImages(formData.imageFiles)
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          showNotification('error', 'Failed to upload images. Please try again.')
          setIsUploading(false)
          setIsSubmitting(false)
          return
        }
        
        setIsUploading(false)
      }

      // Create ticket data matching backend API
      const ticketData: Partial<Ticket> = {
        title: formData.title || generateTitleFromDescription(formData.description),
        description: formData.description,
        location: formData.location,
        category: formData.category || 'maintenance', // Default category
        priority: formData.priority,
        communityId: user!.communityId!,
        reportedBy: user!.id!,
        imageUrl: imageUrls
      }

      // Submit ticket
      const result = await TicketService.createTicket(ticketData)

      // Handle different response types from backend
      if (result.success) {
        // Reset form
        setFormData({
          title: "",
          description: "",
          location: "",
          category: "",
          priority: "auto",
          imageFiles: [],
          imagePreviews: []
        })

        // Clear file input
        const fileInput = document.getElementById('image-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''

        showNotification('success', result.message || 'Your issue has been submitted successfully!')
        
        // Reload data
        await loadData()
      } else {
        showNotification('error', 'Failed to submit issue. Please try again.')
      }

    } catch (error: any) {
      console.error('Error submitting ticket:', error)
      const errorMessage = error.response?.data?.error || 'Failed to submit issue. Please try again.'
      showNotification('error', errorMessage)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'in_progress': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'spam': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Filter and sort community tickets
  const getFilteredAndSortedTickets = () => {
    let filtered = communityTickets

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort tickets
    filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
        return bPriority - aPriority
      } else if (sortBy === "recent") {
        const aTime = a.createdAt?.toDate?.()?.getTime?.() || a.createdAt?._seconds * 1000 || new Date(a.createdAt || 0).getTime()
        const bTime = b.createdAt?.toDate?.()?.getTime?.() || b.createdAt?._seconds * 1000 || new Date(b.createdAt || 0).getTime()
        return bTime - aTime
      }
      return 0
    })

    return filtered
  }

  const filteredCommunityTickets = getFilteredAndSortedTickets()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading tickets...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Notification */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
                <TrendingUp className="mr-3 h-8 w-8 text-primary" />
                Resident Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Welcome back, {user?.name}! Manage your tickets and community reports.
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                Resident
              </Badge>
              {user?.communityId && (
                <p className="text-sm text-muted-foreground mt-1">Community ID: {user.communityId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">My Tickets</p>
                  <p className="text-2xl font-bold text-foreground">{myTickets.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold text-foreground">
                    {myTickets.filter(t => t.status === 'open').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-foreground">
                    {myTickets.filter(t => t.status === 'in_progress' || t.status === 'assigned').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-foreground">
                    {myTickets.filter(t => t.status === 'resolved').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Layout */}
        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="submit">Submit New Issue</TabsTrigger>
            <TabsTrigger value="my-tickets">My Issues ({myTickets.length})</TabsTrigger>
            <TabsTrigger value="community">Community Issues</TabsTrigger>
          </TabsList>

          {/* Submit Ticket Tab */}
          <TabsContent value="submit" className="space-y-6">
            <Card className="shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl text-card-foreground flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Report New Issue
                </CardTitle>
                <p className="text-muted-foreground">Describe the problem and upload photos to help technicians understand the issue better.</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="text-card-foreground font-medium">
                      Title (Optional)
                    </div>
                    <Input
                      type="text"
                      placeholder="Brief title for the issue (will be auto-generated if empty)"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="bg-background border-border focus:border-primary transition-colors"
                      maxLength={100}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="text-card-foreground font-medium">
                      Issue Description <span className="text-red-500">*</span>
                    </div>
                    <Textarea
                      placeholder="Please describe the issue in detail (e.g., 'Water leakage from pipe in bathroom causing floor damage')"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="min-h-[120px] bg-background border-border focus:border-primary transition-colors resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <div className="text-card-foreground font-medium">
                      Location <span className="text-red-500">*</span>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="e.g., Apartment 2B, Building A, Near Main Gate"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="pl-10 bg-background border-border focus:border-primary transition-colors"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <div className="text-card-foreground font-medium">
                      Category (Optional - AI will auto-detect)
                    </div>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Select category or leave for auto-detection" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <div className="text-card-foreground font-medium">
                      Priority
                    </div>
                    <Select value={formData.priority} onValueChange={(value: "low" | "medium" | "high" | "auto") => 
                      setFormData(prev => ({ ...prev, priority: value }))
                    }>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect (Recommended)</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div className="text-card-foreground font-medium">
                      Upload Photos
                    </div>
                    
                    {formData.imagePreviews.length === 0 ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer flex flex-col items-center space-y-4"
                        >
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-medium text-card-foreground">
                              Click to upload photos
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Supports JPG, PNG files up to 5MB each
                            </p>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {formData.imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Issue preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-border"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            id="add-more-images"
                          />
                          <label
                            htmlFor="add-more-images"
                            className="cursor-pointer text-sm text-primary hover:text-primary/80"
                          >
                            + Add more photos
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 transition-all duration-300"
                    size="lg"
                  >
                    {isUploading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading images...</span>
                      </div>
                    ) : isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting issue...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Upload size={16} />
                        <span>Submit Issue</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Tickets Tab */}
          <TabsContent value="my-tickets" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground flex items-center">
                <User className="mr-2 h-6 w-6" />
                My Issues ({myTickets.length})
              </h2>
            </div>

            {myTickets.length === 0 ? (
              <Card className="shadow-sm border-border">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    No Issues Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't reported any issues yet.
                  </p>
                  <Button 
                    onClick={() => (document.querySelector('[value="submit"]') as HTMLElement)?.click()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Report Your First Issue
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {myTickets.map((ticket) => (
                  <Card key={ticket.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Image */}
                        {ticket.imageUrl && ticket.imageUrl.length > 0 && (
                          <div className="w-full lg:w-48 h-48 flex-shrink-0">
                            <img
                              src={ticket.imageUrl[0]}
                              alt="Issue"
                              className="w-full h-full object-cover rounded-lg border border-border"
                            />
                            {ticket.imageUrl.length > 1 && (
                              <p className="text-xs text-muted-foreground mt-1 text-center">
                                +{ticket.imageUrl.length - 1} more image{ticket.imageUrl.length > 2 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 space-y-4">
                          {/* Header with Status */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-card-foreground">
                                  {ticket.title}
                                </h3>
                                <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs font-mono">
                                  #{ticket.id?.slice(-8)}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge className={`${getStatusColor(ticket.status)} border font-medium`}>
                                  {ticket.status.replace('_', ' ')}
                                </Badge>
                                <Badge className={`${getPriorityColor(ticket.priority)} border font-medium`}>
                                  {ticket.priority} Priority
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs capitalize">
                                  {ticket.category.replace('_', ' ')}
                                </Badge>
                                {ticket.assignedTo && (
                                  <Badge className="bg-green-100 text-green-800 border-green-300 text-xs flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Assigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <p className="text-muted-foreground leading-relaxed">
                              {ticket.description}
                            </p>
                          </div>

                          {/* Assigned Technician */}
                          {ticket.assignedTo && (
                            <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-4 border border-green-200 dark:border-green-800">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">
                                    Assigned Technician
                                  </p>
                                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                    {ticket.assignedTechnician?.name || 'Technician Assigned'}
                                  </p>
                                  {ticket.assignedTechnician?.expertise && ticket.assignedTechnician.expertise.length > 0 && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                      Expertise: {ticket.assignedTechnician.expertise.join(', ')}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-green-600 dark:text-green-400">
                                    <span>ID: #{ticket.assignedTo.slice(-6)}</span>
                                    <span className="flex items-center">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Assigned
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* AI Insights */}
                          {ticket.aiMetadata && (
                            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                    AI Analysis & Recommendations
                                  </p>
                                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                    <div className="flex flex-wrap gap-2">
                                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                        Category: {ticket.aiMetadata.predictedCategory}
                                      </Badge>
                                      <Badge className={`text-xs border ${
                                        ticket.aiMetadata.predictedUrgency === 'high' 
                                          ? 'bg-red-100 text-red-800 border-red-300' 
                                          : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                      }`}>
                                        Urgency: {ticket.aiMetadata.predictedUrgency}
                                      </Badge>
                                      {ticket.aiMetadata.confidence && (
                                        <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-xs">
                                          {Math.round(ticket.aiMetadata.confidence * 100)}% confidence
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tools & Materials */}
                          {(ticket.requiredTools?.length || ticket.requiredMaterials?.length) && (
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Estimated Requirements
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    {ticket.estimatedDuration && (
                                      <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Duration:</span>
                                        <span className="ml-1 text-gray-800 dark:text-gray-200">{ticket.estimatedDuration}</span>
                                      </div>
                                    )}
                                    {ticket.difficultyLevel && (
                                      <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Difficulty:</span>
                                        <span className="ml-1 text-gray-800 dark:text-gray-200 capitalize">{ticket.difficultyLevel}</span>
                                      </div>
                                    )}
                                    {(ticket.requiredTools?.length || ticket.requiredMaterials?.length) && (
                                      <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Items:</span>
                                        <span className="ml-1 text-gray-800 dark:text-gray-200">
                                          {(ticket.requiredTools?.length || 0) + (ticket.requiredMaterials?.length || 0)} required
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Location and Date */}
                          <div className="flex flex-col sm:flex-row gap-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2 text-primary" />
                              <span className="font-medium">Location:</span>
                              <span className="ml-1">{ticket.location}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2 text-primary" />
                              <span className="font-medium">Submitted:</span>
                              <span className="ml-1">{formatDate(ticket.createdAt)}</span>
                            </div>
                            {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                              <div className="flex items-center text-muted-foreground">
                                <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                                <span className="font-medium">Updated:</span>
                                <span className="ml-1">{formatDate(ticket.updatedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Community Reports Tab */}
          <TabsContent value="community" className="space-y-6">
            {/* Filters and Controls */}
            <Card className="shadow-sm border-border">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search community issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background border-border"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="w-full lg:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-background border-border">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Issues</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div className="w-full lg:w-48">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort */}
                  <div className="w-full lg:w-48">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="priority">Priority Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-950/50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Open</div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-950/50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.assigned}</div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Assigned</div>
                  </CardContent>
                </Card>
                <Card className="bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.in_progress}</div>
                    <div className="text-sm text-indigo-700 dark:text-indigo-300">In Progress</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950/50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Resolved</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 dark:bg-gray-950/50 border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Total</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Community Reports List */}
            {filteredCommunityTickets.length === 0 ? (
              <Card className="shadow-sm border-border">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    No Issues Found
                  </h3>
                  <p className="text-muted-foreground">
                    No community issues match your current filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredCommunityTickets.map((ticket) => (
                  <Card key={ticket.id} className="shadow-sm border-border hover:shadow-md transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Image */}
                        {ticket.imageUrl && ticket.imageUrl.length > 0 && (
                          <div className="w-full lg:w-80 h-48 flex-shrink-0">
                            <img
                              src={ticket.imageUrl[0]}
                              alt={ticket.title || "Issue"}
                              className="w-full h-full object-cover rounded-lg border border-border"
                            />
                            {ticket.imageUrl.length > 1 && (
                              <p className="text-xs text-muted-foreground mt-1 text-center">
                                +{ticket.imageUrl.length - 1} more image{ticket.imageUrl.length > 2 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-semibold text-card-foreground leading-tight">
                                  {ticket.title}
                                </h3>
                                <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs font-mono">
                                  #{ticket.id?.slice(-8)}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge className={`${getStatusColor(ticket.status)} border font-medium`}>
                                  {ticket.status.replace('_', ' ')}
                                </Badge>
                                <Badge className={`${getPriorityColor(ticket.priority)} border font-medium`}>
                                  {ticket.priority} Priority
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs capitalize">
                                  {ticket.category.replace('_', ' ')}
                                </Badge>
                                {ticket.assignedTo && (
                                  <Badge className="bg-green-100 text-green-800 border-green-300 text-xs flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Assigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-muted-foreground leading-relaxed">
                            {ticket.description}
                          </p>

                          {/* Assigned Technician */}
                          {ticket.assignedTo && (
                            <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-4 border border-green-200 dark:border-green-800">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">
                                    Assigned Technician
                                  </p>
                                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                    {ticket.assignedTechnician?.name || 'Technician Assigned'}
                                  </p>
                                  {ticket.assignedTechnician?.expertise && ticket.assignedTechnician.expertise.length > 0 && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                      Expertise: {ticket.assignedTechnician.expertise.join(', ')}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-green-600 dark:text-green-400">
                                    <span>ID: #{ticket.assignedTo.slice(-6)}</span>
                                    <span className="flex items-center">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Assigned
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* AI Insights */}
                          {ticket.aiMetadata && (
                            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                    AI Analysis & Recommendations
                                  </p>
                                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                    <div className="flex flex-wrap gap-2">
                                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                        Category: {ticket.aiMetadata.predictedCategory}
                                      </Badge>
                                      <Badge className={`text-xs border ${
                                        ticket.aiMetadata.predictedUrgency === 'high' 
                                          ? 'bg-red-100 text-red-800 border-red-300' 
                                          : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                      }`}>
                                        Urgency: {ticket.aiMetadata.predictedUrgency}
                                      </Badge>
                                      {ticket.aiMetadata.confidence && (
                                        <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-xs">
                                          {Math.round(ticket.aiMetadata.confidence * 100)}% confidence
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tools & Materials */}
                          {(ticket.requiredTools?.length || ticket.requiredMaterials?.length) && (
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Estimated Requirements
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    {ticket.estimatedDuration && (
                                      <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Duration:</span>
                                        <span className="ml-1 text-gray-800 dark:text-gray-200">{ticket.estimatedDuration}</span>
                                      </div>
                                    )}
                                    {ticket.difficultyLevel && (
                                      <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Difficulty:</span>
                                        <span className="ml-1 text-gray-800 dark:text-gray-200 capitalize">{ticket.difficultyLevel}</span>
                                      </div>
                                    )}
                                    {(ticket.requiredTools?.length || ticket.requiredMaterials?.length) && (
                                      <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Items:</span>
                                        <span className="ml-1 text-gray-800 dark:text-gray-200">
                                          {(ticket.requiredTools?.length || 0) + (ticket.requiredMaterials?.length || 0)} required
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Location and Metadata */}
                          <div className="flex flex-col sm:flex-row gap-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2 text-primary" />
                              <span className="font-medium">Location:</span>
                              <span className="ml-1">{ticket.location}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2 text-primary" />
                              <span className="font-medium">Reported:</span>
                              <span className="ml-1">{formatDate(ticket.createdAt)}</span>
                            </div>
                            {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                              <div className="flex items-center text-muted-foreground">
                                <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                                <span className="font-medium">Updated:</span>
                                <span className="ml-1">{formatDate(ticket.updatedAt)}</span>
                              </div>
                            )}
                          </div>

                          {/* Reporter Info */}
                          <div className="text-sm text-muted-foreground">
                            Reported by <span className="font-medium text-card-foreground">Community Member</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}