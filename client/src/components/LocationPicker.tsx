import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MapPin, Edit2, Loader2 } from "lucide-react"

interface LocationData {
  address: string
  lat: number
  lng: number
  placeId?: string
}

interface LocationPickerProps {
  value: string
  onChange: (location: string, locationData?: LocationData) => void
  placeholder?: string
  label?: string
  required?: boolean
}

declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

export function LocationPicker({ value, onChange, placeholder = "Enter location", label = "Location", required = false }: LocationPickerProps) {
  const [isManualInput, setIsManualInput] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLocationData, setSelectedLocationData] = useState<LocationData | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  // Load Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleLoaded(true)
      return
    }

    setIsLoading(true)

    // Create a global callback function
    window.initGoogleMaps = () => {
      setIsGoogleLoaded(true)
      setIsLoading(false)
    }

    // Load Google Maps script with Places library
    const script = document.createElement('script')
    // Note: Replace 'YOUR_GOOGLE_MAPS_API_KEY' with actual API key in environment variable
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    script.onerror = () => {
      console.error('Failed to load Google Maps API')
      setIsLoading(false)
      setIsManualInput(true) // Fallback to manual input
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [])

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (isGoogleLoaded && inputRef.current && !isManualInput && !autocompleteRef.current) {
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['(cities)', 'sublocality', 'postal_code', 'country', 'administrative_area_level_1', 'administrative_area_level_2'],
          fields: ['formatted_address', 'place_id', 'geometry', 'name']
        })

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace()
          
          if (place.formatted_address && place.geometry && place.geometry.location) {
            const locationData: LocationData = {
              address: place.formatted_address,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              placeId: place.place_id
            }
            
            setSelectedLocationData(locationData)
            onChange(place.formatted_address, locationData)
          } else if (place.name) {
            // If only name is available, use it
            onChange(place.name)
            setSelectedLocationData(null)
          }
        })
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error)
        setIsManualInput(true) // Fallback to manual input
      }
    }
  }, [isGoogleLoaded, isManualInput, onChange])

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSelectedLocationData(null)
  }

  const toggleInputMode = () => {
    setIsManualInput(!isManualInput)
    setSelectedLocationData(null)
    
    if (autocompleteRef.current) {
      // Clear the autocomplete instance
      window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current)
      autocompleteRef.current = null
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="location" className="text-gray-700 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleInputMode}
          className="text-xs"
          disabled={isLoading}
        >
          {isManualInput ? (
            <>
              <MapPin className="w-3 h-3 mr-1" />
              Use Google
            </>
          ) : (
            <>
              <Edit2 className="w-3 h-3 mr-1" />
              Manual
            </>
          )}
        </Button>
      </div>

      <div className="relative">
        <Input
          ref={inputRef}
          id="location"
          value={value}
          onChange={handleManualInputChange}
          placeholder={
            isLoading 
              ? "Loading Google Maps..." 
              : isManualInput 
                ? "Enter location manually" 
                : isGoogleLoaded 
                  ? "Search for a location..." 
                  : placeholder
          }
          className="bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 transition-colors pr-10"
          required={required}
          disabled={isLoading}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : isManualInput ? (
            <Edit2 className="w-4 h-4 text-gray-400" />
          ) : (
            <MapPin className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center text-xs text-gray-500">
        {isLoading ? (
          <span>Loading Google Maps API...</span>
        ) : isManualInput ? (
          <span>💬 manual input mode - type your location</span>
        ) : !isGoogleLoaded ? (
          <span className="text-red-500">⚠️ Google Maps failed to load - using manual input</span>
        ) : selectedLocationData ? (
          <span className="text-green-600">
            📍 Location selected: {selectedLocationData.lat.toFixed(6)}, {selectedLocationData.lng.toFixed(6)}
          </span>
        ) : (
          <span>🗺️ Google Places - start typing to search locations</span>
        )}
      </div>

      {/* Show coordinates when available */}
      {selectedLocationData && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="font-medium text-green-800">Location Data:</div>
          <div className="text-green-700">
            Latitude: {selectedLocationData.lat.toFixed(6)}
          </div>
          <div className="text-green-700">
            Longitude: {selectedLocationData.lng.toFixed(6)}
          </div>
          {selectedLocationData.placeId && (
            <div className="text-green-600">
              Place ID: {selectedLocationData.placeId}
            </div>
          )}
        </div>
      )}
    </div>
  )
}