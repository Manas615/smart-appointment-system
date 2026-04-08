import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../api";

// Stub global fetch
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

function makeResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

describe("api module", () => {
  describe("getProviders", () => {
    it("fetches /api/providers and returns data", async () => {
      const providers = [{ id: 1, name: "Dr. Smith", specialty: "Cardiology" }];
      mockFetch.mockResolvedValueOnce(makeResponse(providers));

      const result = await api.getProviders();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/providers",
        expect.objectContaining({ headers: { "Content-Type": "application/json" } })
      );
      expect(result).toEqual(providers);
    });

    it("throws when the server returns an error", async () => {
      mockFetch.mockResolvedValueOnce(
        makeResponse({ error: { message: "Internal error" } }, false, 500)
      );

      await expect(api.getProviders()).rejects.toThrow("Internal error");
    });
  });

  describe("bookAppointment", () => {
    it("calls POST /api/appointments with JSON body", async () => {
      const payload = {
        patient_name: "Alice",
        patient_email: "alice@example.com",
        provider_id: 1,
        service_id: 2,
        slot_id: 3,
      };
      const created = { id: 10, ...payload, status: "confirmed" };
      mockFetch.mockResolvedValueOnce(makeResponse(created, true, 201));

      const result = await api.bookAppointment(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/appointments",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
      expect(result.id).toBe(10);
    });

    it("throws on 409 conflict (double booking)", async () => {
      mockFetch.mockResolvedValueOnce(
        makeResponse({ error: { message: "This time slot is already booked" } }, false, 409)
      );

      await expect(api.bookAppointment({})).rejects.toThrow("This time slot is already booked");
    });
  });

  describe("cancelAppointment", () => {
    it("calls PATCH /api/appointments/:id/cancel", async () => {
      const cancelled = { id: 5, status: "cancelled" };
      mockFetch.mockResolvedValueOnce(makeResponse(cancelled));

      const result = await api.cancelAppointment(5);

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/appointments/5/cancel",
        expect.objectContaining({ method: "PATCH" })
      );
      expect(result.status).toBe("cancelled");
    });
  });

  describe("getAppointments", () => {
    it("encodes email in query string", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse([]));

      await api.getAppointments("test+user@example.com");

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("email=test");
      expect(calledUrl).not.toContain("@");
    });
  });

  describe("error message fallback", () => {
    it("uses errors[0].msg when error.message is absent", async () => {
      mockFetch.mockResolvedValueOnce(
        makeResponse({ errors: [{ msg: "Valid email is required" }] }, false, 400)
      );

      await expect(api.getProviders()).rejects.toThrow("Valid email is required");
    });

    it("falls back to generic message when no error info present", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({}, false, 500));

      await expect(api.getProviders()).rejects.toThrow("Something went wrong");
    });
  });
});
