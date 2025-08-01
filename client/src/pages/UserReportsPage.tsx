import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  Calendar, 
  Search, 
  Filter, 
  TrendingUp, 
  Upload, 
  X, 
  ImageIcon,
  Eye,
  User
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useAuth } from "../contexts/AuthContext"

interface Report {
  id: string
  title?: string
  description: string
  location: string
  imagePreview: string
  status: 'Reported' | 'In Progress' | 'Under Review' | 'Resolved' | 'Rejected'
  submittedAt: string
  userId: string
  submittedBy: {
    name: string
    id: string
  }
  votes: {
    upvotes: number
    downvotes: number
    userVotes: { [userId: string]: 'up' | 'down' | null }
  }
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'
  category?: string
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

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'
  const borderColor = type === 'success' ? 'border-green-400' : type === 'error' ? 'border-red-400' : 'border-blue-400'

  return (
    <div className={`fixed top-4 right-4 z-50 animate-in slide-in-from-right-4 duration-500`}>
      <div className={`${bgColor} ${borderColor} border-l-4 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[350px] max-w-md`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'} flex items-center justify-center text-white font-bold text-lg animate-pulse`}>
          {icon}
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

// Helper functions
const generateTitleFromDescription = (description: string) => {
  return description.length > 50 ? description.substring(0, 50) + '...' : description
}

const determinePriority = (description: string): 'Low' | 'Medium' | 'High' | 'Critical' => {
  const urgentKeywords = ['urgent', 'emergency', 'dangerous', 'safety', 'leak', 'broken', 'severe', 'critical']
  const highKeywords = ['important', 'serious', 'major', 'significant', 'damage']
  const mediumKeywords = ['issue', 'problem', 'concern', 'needs attention']
  
  const desc = description.toLowerCase()
  
  if (urgentKeywords.some(keyword => desc.includes(keyword))) return 'Critical'
  if (highKeywords.some(keyword => desc.includes(keyword))) return 'High'
  if (mediumKeywords.some(keyword => desc.includes(keyword))) return 'Medium'
  return 'Low'
}

const determineCategory = (description: string): string => {
  const desc = description.toLowerCase()
  
  if (desc.includes('water') || desc.includes('leak') || desc.includes('pipe') || desc.includes('drainage')) return 'Plumbing'
  if (desc.includes('light') || desc.includes('electric') || desc.includes('power') || desc.includes('wiring')) return 'Electrical'
  if (desc.includes('elevator') || desc.includes('lift')) return 'Elevator'
  if (desc.includes('garden') || desc.includes('plant') || desc.includes('landscape') || desc.includes('sprinkler')) return 'Landscaping'
  if (desc.includes('paint') || desc.includes('wall') || desc.includes('door') || desc.includes('window')) return 'General Maintenance'
  if (desc.includes('hvac') || desc.includes('air conditioning') || desc.includes('heating')) return 'HVAC'
  
  return 'General'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = diffInMs / (1000 * 60 * 60)
  const diffInDays = diffInHours / 24

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
  if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function UserReportsPage() {
  const { user } = useAuth()
  
  // State for all reports
  const [allReports, setAllReports] = useState<Report[]>([])
  const [myReports, setMyReports] = useState<Report[]>([])
  const [communityReports, setCommunityReports] = useState<Report[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    description: "",
    location: "",
    imageFile: null as File | null,
    imagePreview: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
  const [statusFilter, setStatusFilter] = useState<string>("active")
  const [sortBy, setSortBy] = useState<string>("votes")

  // Show notification function
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, isVisible: true })
  }

  // Hide notification function
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }))
  }

  // Load reports from localStorage
  useEffect(() => {
    const storedReports = JSON.parse(localStorage.getItem('communityReports') || '[]')
    setAllReports(storedReports)
    
    if (user) {
      setMyReports(storedReports.filter((r: Report) => r.userId === user.id))
    }
    
    // Load community reports (excluding resolved ones by default)
    setCommunityReports(storedReports.filter((r: Report) => r.status !== 'Resolved'))
  }, [user])

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Please select a valid image file (JPG, PNG, etc.)')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'File size should be less than 5MB')
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: ""
    }))
    const fileInput = document.getElementById('image-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  // Validate form
  const validateForm = () => {
    if (!formData.imageFile) {
      showNotification('error', 'Please upload an image of the issue')
      return false
    }

    if (!formData.description.trim()) {
      showNotification('error', 'Please provide a description of the problem')
      return false
    }

    if (!formData.location.trim()) {
      showNotification('error', 'Please specify the location of the issue')
      return false
    }

    return true
  }

  // Handle report submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Create new report
    const newReport: Report = {
      id: Date.now().toString(),
      title: generateTitleFromDescription(formData.description),
      description: formData.description,
      location: formData.location,
      imagePreview: formData.imagePreview,
      status: 'Reported',
      submittedAt: new Date().toISOString(),
      userId: user?.id || 'anonymous',
      submittedBy: {
        name: user?.name || "Community Member",
        id: user?.id || 'anonymous'
      },
      votes: {
        upvotes: 0,
        downvotes: 0,
        userVotes: {}
      },
      priority: determinePriority(formData.description),
      category: determineCategory(formData.description)
    }

    // Simulate API call
    setTimeout(() => {
      // Save to localStorage
      const existingReports = JSON.parse(localStorage.getItem('communityReports') || '[]')
      const updatedReports = [newReport, ...existingReports]
      localStorage.setItem('communityReports', JSON.stringify(updatedReports))

      // Update state
      setAllReports(updatedReports)
      setMyReports(updatedReports.filter(r => r.userId === user?.id))
      setCommunityReports(updatedReports.filter(r => r.status !== 'Resolved'))

      // Reset form
      setFormData({
        description: "",
        location: "",
        imageFile: null,
        imagePreview: ""
      })

      showNotification('success', 'Your issue has been reported successfully! Our team will review it shortly.')
      setIsSubmitting(false)
    }, 1500)
  }

  // Handle voting
  const handleVote = (reportId: string, voteType: 'up' | 'down') => {
    if (!user) {
      showNotification('error', 'Please login to vote on reports')
      return
    }

    setCommunityReports(prevReports =>
      prevReports.map(report => {
        if (report.id === reportId) {
          const currentVote = report.votes.userVotes[user.id]
          const newUserVotes = { ...report.votes.userVotes }
          let newUpvotes = report.votes.upvotes
          let newDownvotes = report.votes.downvotes

          // Remove previous vote if exists
          if (currentVote === 'up') newUpvotes--
          if (currentVote === 'down') newDownvotes--

          // Add new vote if different from current
          if (currentVote !== voteType) {
            newUserVotes[user.id] = voteType
            if (voteType === 'up') {
              newUpvotes++
              showNotification('success', 'Your upvote has been recorded!')
            } else {
              newDownvotes++
              showNotification('info', 'Your downvote has been recorded.')
            }
          } else {
            // Remove vote if clicking the same button
            newUserVotes[user.id] = null
            showNotification('info', 'Your vote has been removed.')
          }

          // Save votes to localStorage
          localStorage.setItem(`votes_${reportId}`, JSON.stringify(newUserVotes))

          const updatedReport = {
            ...report,
            votes: {
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              userVotes: newUserVotes
            }
          }

          // Update localStorage
          const allReportsFromStorage = JSON.parse(localStorage.getItem('communityReports') || '[]')
          const updatedAllReports = allReportsFromStorage.map((r: Report) => 
            r.id === reportId ? updatedReport : r
          )
          localStorage.setItem('communityReports', JSON.stringify(updatedAllReports))

          return updatedReport
        }
        return report
      })
    )
  }

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Reported': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'In Progress': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Under Review': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get user vote
  const getUserVote = (report: Report) => {
    return user ? report.votes.userVotes[user.id] || null : null
  }

  // Filter and sort community reports
  const getFilteredAndSortedReports = () => {
    let filtered = communityReports

    // Filter by status
    if (statusFilter === "active") {
      filtered = filtered.filter(p => p.status !== 'Resolved')
    } else if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(report =>
        (report.title || report.description).toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort reports - default by votes descending
    filtered.sort((a, b) => {
      if (sortBy === "votes") {
        const aScore = (a.votes?.upvotes || 0) - (a.votes?.downvotes || 0)
        const bScore = (b.votes?.upvotes || 0) - (b.votes?.downvotes || 0)
        return bScore - aScore // Descending order
      } else if (sortBy === "priority") {
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
        return (priorityOrder[b.priority || 'Low'] || 0) - (priorityOrder[a.priority || 'Low'] || 0)
      } else if (sortBy === "recent") {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      }
      return 0
    })

    return filtered
  }

  const filteredCommunityReports = getFilteredAndSortedReports()

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
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
            <TrendingUp className="mr-3 h-8 w-8 text-primary" />
            Community Reports Hub
          </h1>
          <p className="text-muted-foreground text-lg">
            Report issues, track your submissions, and engage with community problems
          </p>
        </div>

        {/* Three-Section Layout */}
        <Tabs defaultValue="community" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="submit">Submit Report</TabsTrigger>
            <TabsTrigger value="my-reports">My Reports</TabsTrigger>
            <TabsTrigger value="community">Community Reports</TabsTrigger>
          </TabsList>

          {/* Section 1: Submit Report */}
          <TabsContent value="submit" className="space-y-6">
            <Card className="shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl text-card-foreground flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Report New Issue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div className="text-card-foreground font-medium">
                      Upload Photo <span className="text-red-500">*</span>
                    </div>
                    
                    {!formData.imagePreview ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
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
                              Click to upload photo
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Supports JPG, PNG files up to 5MB
                            </p>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={formData.imagePreview}
                          alt="Issue preview"
                          className="w-full h-64 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="text-card-foreground font-medium">
                      Problem Description <span className="text-red-500">*</span>
                    </div>
                    <Textarea
                      placeholder="Please describe the issue in detail (e.g., 'Water leakage from pipe in bathroom causing floor damage')"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="min-h-[100px] bg-background border-border focus:border-primary transition-colors resize-none"
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

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-primary-foreground hover:bg-[#262626] font-medium py-3 transition-all duration-300"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting Report...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Upload size={16} />
                        <span>Submit Issue Report</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section 2: My Reports */}
          <TabsContent value="my-reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground flex items-center">
                <User className="mr-2 h-6 w-6" />
                My Reports ({myReports.length})
              </h2>
            </div>

            {myReports.length === 0 ? (
              <Card className="shadow-sm border-border">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    No Reports Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any issue reports yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {myReports.map((report) => (
                  <Card key={report.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Image */}
                        <div className="w-full lg:w-48 h-48 flex-shrink-0">
                          <img
                            src={report.imagePreview}
                            alt="Issue"
                            className="w-full h-full object-cover rounded-lg border border-border"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-4">
                          {/* Header with Status */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={`${getStatusColor(report.status)} border`}>
                                  {report.status}
                                </Badge>
                                <Badge className={`${getPriorityColor(report.priority)} border`}>
                                  {report.priority || 'Low'} Priority
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Report #{report.id.slice(-6)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <h3 className="font-semibold text-card-foreground mb-2">Description:</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              {report.description}
                            </p>
                          </div>

                          {/* Location and Date */}
                          <div className="flex flex-col sm:flex-row gap-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2 text-primary" />
                              <span className="font-medium">Location:</span>
                              <span className="ml-1">{report.location}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2 text-primary" />
                              <span className="font-medium">Submitted:</span>
                              <span className="ml-1">{formatDate(report.submittedAt)}</span>
                            </div>
                          </div>

                          {/* Vote Count Display */}
                          <div className="text-sm text-muted-foreground">
                            Votes: {(report.votes?.upvotes || 0) - (report.votes?.downvotes || 0)} 
                            ({report.votes?.upvotes || 0} upvotes, {report.votes?.downvotes || 0} downvotes)
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Section 3: Community Reports with Voting */}
          <TabsContent value="community" className="space-y-6">
            {/* Filters and Controls */}
            <Card className="shadow-sm border-border">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search community reports..."
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
                        <SelectItem value="active">Active Issues</SelectItem>
                        <SelectItem value="all">All Issues</SelectItem>
                        <SelectItem value="reported">Reported</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="under review">Under Review</SelectItem>
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
                        <SelectItem value="votes">Most Upvoted</SelectItem>
                        <SelectItem value="priority">Priority Level</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Reports List */}
            {filteredCommunityReports.length === 0 ? (
              <Card className="shadow-sm border-border">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    No Reports Found
                  </h3>
                  <p className="text-muted-foreground">
                    No community reports match your current filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredCommunityReports.map((report) => (
                  <Card key={report.id} className="shadow-sm border-border hover:shadow-md transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Image */}
                        <div className="w-full lg:w-80 h-48 flex-shrink-0">
                          <img
                            src={report.imagePreview}
                            alt={report.title || "Issue"}
                            className="w-full h-full object-cover rounded-lg border border-border"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-card-foreground mb-2 leading-tight">
                                {report.title || generateTitleFromDescription(report.description)}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge className={`${getPriorityColor(report.priority)} border text-xs font-medium`}>
                                  {report.priority || 'Low'} Priority
                                </Badge>
                                <Badge className={`${getStatusColor(report.status)} border text-xs font-medium`}>
                                  {report.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                  {report.category || 'General'}
                                </span>
                              </div>
                            </div>

                            {/* Voting Section */}
                            <div className="flex flex-col items-center space-y-2 bg-muted/30 rounded-lg p-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVote(report.id, 'up')}
                                className={`h-8 w-8 p-0 rounded-full transition-all duration-200 ${
                                  getUserVote(report) === 'up' 
                                    ? 'bg-green-500 text-white hover:bg-green-600' 
                                    : 'hover:bg-green-100 hover:text-green-600'
                                }`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              
                              <div className="text-center">
                                <div className="text-lg font-bold text-card-foreground">
                                  {(report.votes?.upvotes || 0) - (report.votes?.downvotes || 0)}
                                </div>
                                <div className="text-xs text-muted-foreground">votes</div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVote(report.id, 'down')}
                                className={`h-8 w-8 p-0 rounded-full transition-all duration-200 ${
                                  getUserVote(report) === 'down' 
                                    ? 'bg-red-500 text-white hover:bg-red-600' 
                                    : 'hover:bg-red-100 hover:text-red-600'
                                }`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-muted-foreground leading-relaxed">
                            {report.description}
                          </p>

                          {/* Location and Metadata */}
                          <div className="flex flex-col sm:flex-row gap-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2 text-primary" />
                              <span className="font-medium">Location:</span>
                              <span className="ml-1">{report.location}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2 text-primary" />
                              <span className="font-medium">Reported:</span>
                              <span className="ml-1">{formatDate(report.submittedAt)}</span>
                            </div>
                          </div>

                          {/* Reporter Info */}
                          <div className="text-sm text-muted-foreground">
                            Reported by <span className="font-medium text-card-foreground">{report.submittedBy?.name || "Community Member"}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Community Stats */}
            <Card className="bg-muted/30 border-border">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4 text-center">Community Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-card-foreground">{communityReports.length}</div>
                    <div className="text-sm text-muted-foreground">Active Issues</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {communityReports.filter(p => p.priority === 'Critical').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Critical</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {communityReports.filter(p => p.status === 'In Progress').length}
                    </div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {communityReports.reduce((total, p) => total + (p.votes?.upvotes || 0), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Upvotes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
