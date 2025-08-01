import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Building, Users, Loader2 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { api } from "@/utils/api"
import Notification from "@/components/ui/notification"
import { LocationPicker } from "@/components/LocationPicker"

interface Community {
  id: string
  name: string
  managerId: string
  location: string
  latitude?: number
  longitude?: number
  placeId?: string
  description?: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  isActive: boolean
  createdAt: any
  updatedAt: any
}

export function Dashboard() {
  const { user } = useAuth()
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    placeId: undefined as string | undefined,
    description: '',
    address: '',
    contactEmail: '',
    contactPhone: ''
  })
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
    isVisible: boolean
  }>({
    type: 'success',
    message: '',
    isVisible: false
  })

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message, isVisible: true })
  }

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }))
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'resident': return 'Resident'
      case 'technician': return 'Technician'
      case 'manager': return 'Manager'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'resident': return 'bg-blue-100 text-blue-800'
      case 'technician': return 'bg-green-100 text-green-800'
      case 'manager': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Fetch communities created by this manager
  const fetchCommunities = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const response = await api.get(`/api/communities?managerId=${user.id}`)
      if (response.data.success) {
        setCommunities(response.data.communities)
      }
    } catch (error: any) {
      console.error('Error fetching communities:', error)
      showNotification('error', 'Failed to fetch communities')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'manager') {
      fetchCommunities()
    }
  }, [user])

  // Role validation - redirect non-managers
  useEffect(() => {
    if (user && user.role !== 'manager') {
      showNotification('error', 'Access denied. Only managers can access this page.')
      // Redirect to appropriate dashboard based on role
      setTimeout(() => {
        switch (user.role) {
          case 'resident':
            window.location.href = '/user-dashboard'
            break
          case 'technician':
            window.location.href = '/technician-dashboard'
            break
          default:
            window.location.href = '/login'
        }
      }, 2000)
    }
  }, [user])

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      latitude: undefined,
      longitude: undefined,
      placeId: undefined,
      description: '',
      address: '',
      contactEmail: '',
      contactPhone: ''
    })
    setShowCreateForm(false)
    setEditingCommunity(null)
  }

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        managerId: user.id
      }

      const response = await api.post('/api/communities', payload)
      if (response.data.success) {
        showNotification('success', 'Community created successfully!')
        fetchCommunities()
        resetForm()
      }
    } catch (error: any) {
      console.error('Error creating community:', error)
      const errorMessage = error.response?.data?.error || 'Failed to create community'
      showNotification('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCommunity) return

    setIsLoading(true)
    try {
      const response = await api.put(`/api/communities/${editingCommunity.id}`, formData)
      if (response.data.success) {
        showNotification('success', 'Community updated successfully!')
        fetchCommunities()
        resetForm()
      }
    } catch (error: any) {
      console.error('Error updating community:', error)
      const errorMessage = error.response?.data?.error || 'Failed to update community'
      showNotification('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCommunity = (community: Community) => {
    setEditingCommunity(community)
    setFormData({
      name: community.name,
      location: community.location,
      latitude: community.latitude,
      longitude: community.longitude,
      placeId: community.placeId,
      description: community.description || '',
      address: community.address || '',
      contactEmail: community.contactEmail || '',
      contactPhone: community.contactPhone || ''
    })
    setShowCreateForm(true)
  }

  const handleDeleteCommunity = async (communityId: string) => {
    if (!confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await api.delete(`/api/communities/${communityId}`)
      if (response.data.success) {
        showNotification('success', 'Community deleted successfully!')
        fetchCommunities()
      }
    } catch (error: any) {
      console.error('Error deleting community:', error)
      const errorMessage = error.response?.data?.error || 'Failed to delete community'
      showNotification('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}!</p>
            </div>
            <div className="text-right">
              <Badge className={`${getRoleBadgeColor(user?.role || '')} px-3 py-1`}>
                {getRoleDisplay(user?.role || '')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards for Manager */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Communities</p>
                  <p className="text-2xl font-bold text-gray-900">{communities.length}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Communities</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {communities.filter(c => c.isActive).length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Residents</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Community Management Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Community Management</h2>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Button>
          </div>

          {/* Create/Edit Community Form */}
          {showCreateForm && (
            <Card className="mb-6 border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingCommunity ? 'Edit Community' : 'Create New Community'}
                  </h3>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>

                <form onSubmit={editingCommunity ? handleUpdateCommunity : handleCreateCommunity} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Community Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        placeholder="Enter community name"
                        required
                      />
                    </div>
                    
                    <div>
                      <LocationPicker
                        value={formData.location}
                        onChange={(location, locationData) => {
                          handleFormChange('location', location)
                          if (locationData) {
                            setFormData(prev => ({
                              ...prev,
                              latitude: locationData.lat,
                              longitude: locationData.lng,
                              placeId: locationData.placeId
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              latitude: undefined,
                              longitude: undefined,
                              placeId: undefined
                            }))
                          }
                        }}
                        label="Location"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Full Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Enter community description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                        placeholder="community@example.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                        placeholder="Enter contact phone"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingCommunity ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingCommunity ? 'Update Community' : 'Create Community'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Communities List */}
          {isLoading && communities.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading communities...</span>
            </div>
          ) : communities.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="p-8 text-center">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Communities Yet</h3>
                <p className="text-gray-500 mb-4">Create your first community to get started</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Community
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <Card key={community.id} className="border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {community.name}
                        </h3>
                        <p className="text-sm text-gray-500">{community.location}</p>
                      </div>
                      <Badge
                        className={community.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {community.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {community.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {community.description}
                      </p>
                    )}

                    {community.address && (
                      <p className="text-xs text-gray-500 mb-3">
                        📍 {community.address}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCommunity(community)}
                          className="border-gray-300"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCommunity(community.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="text-xs text-gray-400">
                        Created {new Date(community.createdAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}