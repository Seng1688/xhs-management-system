"use client"

import * as React from "react"

function useEscapeKey(onEscape: () => void, isEnabled = true) {
  React.useEffect(() => {
    if (!isEnabled) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return
      }

      event.preventDefault()
      onEscape()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isEnabled, onEscape])
}

export { useEscapeKey }
