import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
// import { MoonIcon, SunIcon } from "@radix-ui/react-icons"

export function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <Button size="icon" variant="ghost" aria-label="Toggle Dark Mode"
      onClick={() => setDark((d) => !d)}
    >
      {/* {dark
        ? <SunIcon className="h-5 w-5" />
        : <MoonIcon className="h-5 w-5" />} */}
    </Button>
  )
}
