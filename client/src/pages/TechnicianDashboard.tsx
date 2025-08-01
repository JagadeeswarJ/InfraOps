import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wrench, Clock, CheckCircle, AlertTriangle, User, Settings, MapPin, Star } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export function TechnicianDashboard() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Technician Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}!</p>
            </div>
            <div className="text-right">
              <Badge className="bg-green-100 text-green-800 px-3 py-1">
                Technician
              </Badge>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <Star className="w-3 h-3 mr-1" />
                <span>4.8 Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assigned Tickets */}
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Assigned Tickets</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Water leak - Apt 204</p>
                      <p className="text-xs text-gray-500">📍 Building A, Floor 2</p>
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    Urgent
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">AC repair - Apt 156</p>
                      <p className="text-xs text-gray-500">📍 Building B, Floor 1</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    In Progress
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Light fixture - Lobby</p>
                      <p className="text-xs text-gray-500">📍 Main Building, Ground Floor</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    Assigned
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Door lock - Apt 301</p>
                      <p className="text-xs text-gray-500">📍 Building C, Floor 3</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    Scheduled
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
                  className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Ticket Complete
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-300 hover:bg-gray-50"
                  size="lg"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  View All Tickets
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-300 hover:bg-gray-50"
                  size="lg"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Route Planner
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-300 hover:bg-gray-50"
                  size="lg"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Tools & Inventory
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

        {/* Skills & Performance */}
        <div className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skills */}
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {user?.expertise ? user.expertise.map((skill: string, index: number) => (
                    <Badge key={index} className="bg-green-100 text-green-800">
                      {skill}
                    </Badge>
                  )) : (
                    <>
                      <Badge className="bg-green-100 text-green-800">Plumbing</Badge>
                      <Badge className="bg-green-100 text-green-800">Electrical</Badge>
                      <Badge className="bg-green-100 text-green-800">HVAC</Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance This Month</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tickets Completed</span>
                    <span className="font-semibold">47</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-semibold">4.8</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="font-semibold">12 min avg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}