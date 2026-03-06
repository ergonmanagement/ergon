import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileImageUpload } from "@/app/profile/_components/profile-image-upload";

jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { email: "user@example.com" } }),
}));

const mockUpload = jest.fn();
const mockUseProfileImageUpload = jest.fn();
jest.mock("@/hooks/use-profile-image-upload", () => ({
  useProfileImageUpload: () => mockUseProfileImageUpload(),
}));

const defaultProfile = {
  profile_picture_url: null,
  first_name: "John",
  last_name: "Doe",
};

describe("ProfileImageUpload", () => {
  beforeEach(() => {
    mockUpload.mockClear();
    mockUseProfileImageUpload.mockReturnValue({
      upload: mockUpload,
      uploading: false,
      uploadedUrl: null,
      error: null,
    });
  });

  it("renders avatar with initials and click to change hint", () => {
    render(<ProfileImageUpload profile={defaultProfile} />);
    expect(screen.getByRole("img", { name: "Avatar for JD" })).toBeInTheDocument();
    expect(screen.getByText("Click to change photo")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows error when error is provided", () => {
    mockUseProfileImageUpload.mockReturnValueOnce({
      upload: mockUpload,
      uploading: false,
      uploadedUrl: null,
      error: "Upload failed",
    });
    render(<ProfileImageUpload profile={defaultProfile} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
  });

  it("has hidden file input with correct accept types", () => {
    render(<ProfileImageUpload profile={defaultProfile} />);
    const input = screen.getByLabelText("Upload profile picture");
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
    );
  });

  it("calls upload when file is selected", () => {
    mockUpload.mockResolvedValue(undefined);
    render(<ProfileImageUpload profile={defaultProfile} />);
    const input = screen.getByLabelText("Upload profile picture");
    const file = new File(["content"], "avatar.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(mockUpload).toHaveBeenCalledWith(file);
  });
});
