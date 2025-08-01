import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

export function HomePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Simplified service offerings with concise content
  const serviceOfferings = [
    {
      category: "For Residents",
      subtitle: "Report Issues Easily",
      description: "Smart tools to report and track community problems effortlessly.",
      features: [
        {
          icon: "📸",
          title: "Smart Camera",
          description: "Take a photo - AI detects the problem type automatically"
        },
        {
          icon: "🗣️",
          title: "Voice Reports", 
          description: "Just say what's broken and we'll create the ticket"
        },
        {
          icon: "🔍",
          title: "Live Updates",
          description: "Get real-time progress updates on your reports"
        }
      ],
      buttonText: "Start Reporting",
      buttonLink: "/login"
    },
    {
      category: "For Technicians",
      subtitle: "Work Smarter", 
      description: "AI-powered tools to make repairs faster and more efficient.",
      features: [
        {
          icon: "📍",
          title: "Smart Routes",
          description: "Get the fastest path to all your repair jobs"
        },
        {
          icon: "🔧",
          title: "AR Guidance",
          description: "See repair steps overlaid on broken equipment"
        },
        {
          icon: "⏱️",
          title: "Smart Prep",
          description: "Know exactly what tools to bring before you go"
        }
      ],
      buttonText: "Join Network",
      buttonLink: "/login"
    },
    {
      category: "For Administrators",
      subtitle: "Manage Intelligently",
      description: "Predictive insights and automated reports for better management.",
      features: [
        {
          icon: "📊",
          title: "Smart Alerts",
          description: "AI spots patterns and recurring issues automatically"
        },
        {
          icon: "💰",
          title: "Cost Savings",
          description: "Predict failures before they become expensive"
        },
        {
          icon: "📝",
          title: "Auto Reports",
          description: "Monthly maintenance reports generated automatically"
        }
      ],
      buttonText: "Admin Access",
      buttonLink: "/login"
    }
  ]

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section - Constrained Width */}
      <section className="pt-20 pb-16 px-6 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/30 rounded-full animate-pulse-slow"></div>
        </div>
        
        {/* Centered content container with proper constraints */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className={`transition-opacity duration-1000 ${isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}>
            <Badge className="mb-6 bg-secondary text-secondary-foreground border-border hover-glow">
              <span className="animate-pulse">🚀</span> AI-Powered Community Management
            </Badge>
          </div>
          
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}>
            <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
              Smart Solutions for <span className="text-primary">Better Communities</span>
            </h1>
          </div>
          
          <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              AI-powered maintenance management that makes community living better for everyone.
            </p>
          </div>
          
          <div className={`flex gap-4 justify-center transition-all duration-1000 delay-600 ${isVisible ? 'animate-scale-in opacity-100' : 'opacity-0'}`}>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-[#262626] px-8 py-3 text-base font-medium hover-lift hover-glow group">
              <span className="group-hover:animate-pulse">Get Started</span>
            </Button>
            <Link to="/login">
              <Button variant="outline" size="lg" className="px-8 py-3 text-base border-border text-foreground hover:bg-accent hover-lift">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What We Offer Section - Properly Aligned with Generous Side Margins */}
      <section className="py-20 px-12 bg-muted relative">
        <div className="max-w-4xl mx-auto">
          {/* Header aligned with cards */}
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold text-foreground mb-4 transition-all duration-1000 ${isVisible ? 'animate-slide-in-left' : 'opacity-0'}`}>
              What We Offer
            </h2>
            <p className={`text-lg text-muted-foreground max-w-2xl mx-auto transition-all duration-1000 delay-200 ${isVisible ? 'animate-slide-in-right' : 'opacity-0'}`}>
              Simple, powerful tools for residents, technicians, and administrators.
            </p>
          </div>
          
          {/* Cards container with proper alignment */}
          <div className="grid lg:grid-cols-3 gap-6">
            {serviceOfferings.map((service, index) => (
              <div key={index} className={`transition-all duration-1000 delay-${(index + 1) * 200} ${isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}>
                <Card className="h-full bg-card border-border shadow-lg hover-lift hover-glow group relative overflow-hidden flex flex-col">
                  {/* Simplified Card Header */}
                  <CardHeader className="pb-4 pt-6 flex-shrink-0">
                    <div className="flex items-center justify-center mb-4">
                      <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 font-semibold">
                        {service.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-card-foreground text-center mb-3 group-hover:text-primary transition-colors duration-300">
                      {service.subtitle}
                    </CardTitle>
                    <p className="text-muted-foreground text-center text-sm leading-relaxed px-2">
                      {service.description}
                    </p>
                  </CardHeader>
                  
                  {/* Simplified Features */}
                  <CardContent className="pb-6 px-6 flex-grow flex flex-col justify-between">
                    <div className="space-y-4 mb-6 flex-grow">
                      {service.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-3 group/feature">
                          <div className="text-xl group-hover/feature:animate-float flex-shrink-0">
                            {feature.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-card-foreground text-sm mb-1">
                              {feature.title}
                            </h4>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Simplified CTA Button */}
                    <div className="text-center mt-auto">
                      <Link to={service.buttonLink}>
                        <Button 
                          variant="outline" 
                          className="w-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 text-sm py-2"
                        >
                          {service.buttonText}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Aligned with Same Container Width */}
      <section className="py-16 px-12 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold text-foreground mb-4 transition-all duration-1000 ${isVisible ? 'animate-slide-in-left' : 'opacity-0'}`}>
              How It Works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Report", desc: "AI identifies issues from photos or voice", icon: "📱" },
              { title: "Assign", desc: "Smart routing to the right technician", icon: "🎯" },
              { title: "Resolve", desc: "Guided repairs with real-time updates", icon: "✅" }
            ].map((step, i) => (
              <div key={i} className={`transition-all duration-1000 delay-${(i + 3) * 200} ${isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}>
                <Card className="text-center bg-card border-border shadow-sm hover-lift hover-glow group h-full">
                  <CardHeader className="pb-3 pt-6">
                    <div className="text-3xl mb-3 group-hover:animate-float">{step.icon}</div>
                    <CardTitle className="text-base text-card-foreground group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Same Alignment */}
      <section className="py-12 px-12 bg-muted">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            {[
              { number: "85%", label: "Faster Resolution" },
              { number: "60%", label: "Cost Reduction" },
              { number: "99%", label: "User Satisfaction" }
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-lg bg-card border border-border hover-lift transition-all duration-1000 delay-${(i + 1) * 200} ${isVisible ? 'animate-scale-in opacity-100' : 'opacity-0'}`}>
                <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Consistent Alignment */}
      <section className="py-16 px-12 bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <Card className={`bg-card border-border shadow-lg hover-glow transition-all duration-1000 delay-400 ${isVisible ? 'animate-scale-in opacity-100' : 'opacity-0'}`}>
            <CardHeader className="pt-8 pb-4">
              <CardTitle className="text-2xl font-bold text-card-foreground mb-3">
                Ready to Get Started?
              </CardTitle>
              <p className="text-muted-foreground">
                Join communities using AI-powered maintenance management.
              </p>
            </CardHeader>
            <CardContent className="pb-8">
              <Link to="/login">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-[#262626] px-8 py-3 font-medium hover-lift hover-glow group">
                  <span className="group-hover:animate-pulse">Start Free Trial</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-6 px-12 border-t border-border bg-muted transition-all duration-1000 delay-800 ${isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}>
        <div className="max-w-4xl mx-auto flex justify-center items-center">
          <div className="text-sm text-muted-foreground">
            © 2025 Community Platform. Powered by AI.
          </div>
        </div>
      </footer>
    </div>
  )
}
