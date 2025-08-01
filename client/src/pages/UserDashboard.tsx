import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, MessageSquare, Settings, User, FileText, Bell } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export function UserDashboard() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Resident Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}!</p>
            </div>
            <div className="text-right">
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                Resident
              </Badge>
              {user?.communityId && (
                <p className="text-sm text-gray-500 mt-1">Community ID: {user.communityId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Home className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tickets */}
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Recent Tickets</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Leaky faucet in kitchen</p>
                      <p className="text-xs text-gray-500">Submitted 2 hours ago</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Broken light fixture</p>
                      <p className="text-xs text-gray-500">Completed yesterday</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Resolved
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">AC not cooling properly</p>
                      <p className="text-xs text-gray-500">Completed 3 days ago</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Resolved
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Submit New Ticket
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-300 hover:bg-gray-50"
                  size="lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View All Tickets
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-300 hover:bg-gray-50"
                  size="lg"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-300 hover:bg-gray-50"
                  size="lg"
                >
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-300 hover:bg-gray-50"
                  size="lg"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Community Info */}
        <div className="mt-8">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Information</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Home className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-900">Your Community</p>
                    <p className="text-sm text-blue-700">
                      You are a resident in this community. Submit maintenance tickets for any issues in your unit or common areas.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}