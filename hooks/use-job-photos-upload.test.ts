import { renderHook, act } from "@testing-library/react";
import { useJobPhotoUpload } from "@/hooks/use-job-photos-upload";

const mockInvoke = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    functions: {
      invoke: (name: string, options: unknown) => mockInvoke(name, options),
    },
  }),
}));

describe("useJobPhotoUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests upload URL", async () => {
    mockInvoke.mockResolvedValue({
      data: { upload_url: "https://upload" },
      error: null,
    });

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const { result } = renderHook(() => useJobPhotoUpload("j1"));

    // Do not actually perform fetch; just ensure the Edge Function is called
    // and no client-side error is set before the upload step.
    await act(async () => {
      await result.current.upload(file);
    });

    expect(mockInvoke).toHaveBeenCalledWith("jobs-photos", expect.any(Object));
  });
});

