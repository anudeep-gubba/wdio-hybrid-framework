export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
  },

  EVENT: {
    CREATE: "/events",
    UPDATE: (id: number) => `/events/${id}`,
    DELETE: (id: number) => `/events/${id}`,
  },
} as const;
