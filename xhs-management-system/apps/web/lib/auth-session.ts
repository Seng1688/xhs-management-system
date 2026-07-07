const authSessionKey = "xhs-management-authenticated"

function setAuthenticated() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(authSessionKey, "true")
}

function clearAuthenticated() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(authSessionKey)
}

function isAuthenticated() {
  if (typeof window === "undefined") {
    return false
  }

  return window.localStorage.getItem(authSessionKey) === "true"
}

export { clearAuthenticated, isAuthenticated, setAuthenticated }
