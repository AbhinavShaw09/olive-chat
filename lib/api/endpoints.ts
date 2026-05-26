export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },
  CHAT: {
    SEND: "/api/chat",
    HISTORY: "/api/chat/history",
  }
} as const;