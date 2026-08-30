/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
// test/setup-dom.js registers these at runtime; the import is what tells
// TypeScript that `toBeInTheDocument` exists.
import "@testing-library/jest-dom";

import MenuList from "@mui/material/MenuList";

import useBehavior from "@/services/oni-save/hooks/useBehavior";

import ReviveMenuItem from "./ReviveMenuItem";

jest.mock("react-i18next", () => {
  const common = jest.requireActual("@/translations/en/common.json");
  const lookup = (key: string): unknown =>
    key
      .split(".")
      .reduce<any>((node, part) => (node == null ? node : node[part]), common);
  const t = (key: string, options: Record<string, unknown> = {}) => {
    const template = lookup(key);
    return typeof template === "string"
      ? template
      : (options.defaultValue ?? key);
  };
  return {
    useTranslation: () => ({ t, i18n: { language: "en" } }),
    Trans: ({ i18nKey, children }: { i18nKey: string; children?: any }) =>
      t(i18nKey, { defaultValue: children }),
  };
});

jest.mock("@/services/oni-save/hooks/useBehavior", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseBehavior = useBehavior as jest.MockedFunction<typeof useBehavior>;

let modify: jest.Mock;

beforeEach(() => {
  modify = jest.fn();
  mockUseBehavior.mockReturnValue({
    templateData: {
      alignmentActive: false,
      targeted: false,
      targetable: false,
    },
    extraData: null,
    onTemplateDataModify: modify,
    onExtraDataModify: jest.fn(),
  } as any);
});

// MUI v9 MenuItem reads MenuListContext and throws without it, so the item
// has to be mounted the way the menu really mounts it.
const renderItem = (onClick: () => void) =>
  render(
    <MenuList>
      <ReviveMenuItem gameObjectId={1} onClick={onClick} />
    </MenuList>,
  );

describe("ReviveMenuItem", () => {
  it("reads the behavior death actually marks", () => {
    renderItem(jest.fn());

    expect(mockUseBehavior).toHaveBeenCalledWith(1, "FactionAlignment");
    expect(screen.getByText("Revive")).toBeInTheDocument();
  });

  // Dying clears alignmentActive and targetable, so reviving has to write both
  // back. A version that only restored alignmentActive passed a "does it write
  // something" test and left a duplicant nothing could target.
  it("puts the duplicant back in the faction and closes the menu", () => {
    const onClick = jest.fn();
    renderItem(onClick);

    fireEvent.click(screen.getByText("Revive"));

    expect(modify).toHaveBeenCalledWith({
      alignmentActive: true,
      targetable: true,
    });
    expect(onClick).toHaveBeenCalled();
  });
});
