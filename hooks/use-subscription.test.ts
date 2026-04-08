import { renderHook, act } from "@testing-library/react";
import { useSubscription } from "@/hooks/use-subscription";

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (col: string, val: string) => ({
          single: () => mockFrom(table, cols, col, val),
        }),
      }),
    }),
  }),
}));

describe("useSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads company subscription", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    // First from() call: users
    mockFrom
      .mockResolvedValueOnce({
        data: { company_id: "c1" },
        error: null,
      })
      // Second from() call: companies
      .mockResolvedValueOnce({
        data: {
          id: "c1",
          name: "Test Co",
          service_type: "Detailing",
          phone: "555-0100",
          address: null,
          subscription_status: "trial",
          trial_started_at: null,
          trial_ends_at: null,
        },
        error: null,
      });

    const { result } = renderHook(() => useSubscription());

    await act(async () => {});

    expect(result.current.company?.id).toBe("c1");
    expect(result.current.company?.subscription_status).toBe("trial");
    expect(result.current.error).toBeNull();
  });
});

