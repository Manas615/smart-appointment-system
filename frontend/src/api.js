const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || data.errors?.[0]?.msg || "Something went wrong");
  }

  return data;
}

export const api = {
  // Providers
  getProviders: () => request("/providers"),
  getProvider: (id) => request(`/providers/${id}`),

  // Services
  getServices: (providerId) => request(`/services/provider/${providerId}`),

  // Slots
  getAvailableDates: (providerId) => request(`/slots/dates/${providerId}`),
  getSlots: (providerId, date) => request(`/slots/provider/${providerId}?date=${date}`),

  // Appointments
  bookAppointment: (data) =>
    request("/appointments", { method: "POST", body: JSON.stringify(data) }),
  getAppointments: (email) => request(`/appointments?email=${encodeURIComponent(email)}`),
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: "PATCH" }),
  rescheduleAppointment: (id, newSlotId) =>
    request(`/appointments/${id}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify({ new_slot_id: newSlotId }),
    }),

  // Reviews
  submitReview: (data) => request("/reviews", { method: "POST", body: JSON.stringify(data) }),
  getProviderReviews: (providerId) => request(`/reviews/provider/${providerId}`),

  // Dashboard
  getDashboardStats: () => request("/dashboard/stats"),
  getRecentAppointments: () => request("/dashboard/recent"),
  getPopularProviders: () => request("/dashboard/popular-providers"),
  getSpecialtyDistribution: () => request("/dashboard/specialty-distribution"),

  // Provider Schedule (issues #12, #13)
  getProviderSchedule: (providerId, date) =>
    request(`/appointments/provider/${providerId}${date ? `?date=${date}` : ""}`),
  getAllSlots: (providerId, date) => request(`/slots/provider/${providerId}?date=${date}&all=1`),

  // Slot Management (issue #10)
  deleteSlot: (slotId) => request(`/slots/${slotId}`, { method: "DELETE" }),

  // Admin (issues #16, #17, #18, #19)
  adminGetAppointments: () => request("/admin/appointments"),
  adminDeleteAppointment: (id) => request(`/admin/appointments/${id}`, { method: "DELETE" }),
  adminUpdateProvider: (id, data) =>
    request(`/admin/providers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteProvider: (id) => request(`/admin/providers/${id}`, { method: "DELETE" }),
  adminGetReports: () => request("/admin/reports"),
  adminGetActivity: () => request("/admin/activity"),
};
