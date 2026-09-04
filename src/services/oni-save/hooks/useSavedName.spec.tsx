/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";

import useBehavior from "./useBehavior";
import useSavedName from "./useSavedName";

jest.mock("./useBehavior", () => ({ __esModule: true, default: jest.fn() }));

const mockUseBehavior = useBehavior as jest.MockedFunction<typeof useBehavior>;

function withSavedName(savedName: string | null) {
  mockUseBehavior.mockReturnValue({
    templateData: savedName === null ? null : { savedName },
    extraData: null,
    onTemplateDataModify: jest.fn(),
    onExtraDataModify: jest.fn(),
  });
}

describe("useSavedName", () => {
  afterEach(() => jest.clearAllMocks());

  it("reads the object's UserNameable behavior", () => {
    withSavedName("Copper Volcano FP34‑1");
    const { result } = renderHook(() => useSavedName(42));

    expect(result.current).toBe("Copper Volcano FP34‑1");
    expect(mockUseBehavior).toHaveBeenCalledWith(42, "UserNameable");
  });

  // Not every object carries the behavior, and a save from a game version
  // that stores an empty name for an unrenamed object should read the same
  // as one that stores nothing: the caller falls back to the type.
  it("is null when the object has no name", () => {
    withSavedName(null);
    expect(renderHook(() => useSavedName(42)).result.current).toBe(null);

    withSavedName("");
    expect(renderHook(() => useSavedName(42)).result.current).toBe(null);
  });
});
