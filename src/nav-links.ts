import { DLCIds } from "oni-save-parser";

export interface NavItem {
  name: string;
  path: string;

  /**
   * Only show this item when the save has these content packs active.
   * Several ids mean "all of these". `DLCIds.None` means base game only.
   */
  requireDLC?: string | string[];
  i18nKey: string;
  saveRequired?: boolean;
}

const NavItems: NavItem[] = [
  {
    name: "Overview",
    path: "/",
    i18nKey: "overview-page.title",
  },
  {
    name: "Duplicants",
    path: "/duplicants",
    i18nKey: "duplicant.noun_titlecase_plural",
    saveRequired: true,
  },
  {
    name: "Geysers",
    path: "/geysers",
    i18nKey: "geyser.noun_titlecase_plural",
    saveRequired: true,
  },
  {
    name: "Creatures",
    path: "/creatures",
    i18nKey: "creature.noun_titlecase_plural",
    saveRequired: true,
  },
  {
    // Spaced Out! replaced the classic starmap with a cluster of asteroids.
    // Every later pack builds on it, so this is the one gate that matters.
    name: "Worlds",
    path: "/worlds",
    requireDLC: DLCIds.SpacedOut,
    i18nKey: "world.noun_titlecase_plural",
    saveRequired: true,
  },
  {
    name: "Materials",
    path: "/materials",
    i18nKey: "material.noun_titlecase_plural",
    saveRequired: true,
  },
  {
    name: "Raw Editor",
    path: "/raw",
    i18nKey: "raw-editor-page.title",
    saveRequired: true,
  },
  {
    name: "Changelog",
    path: "/changelog",
    i18nKey: "changelog.title",
  },
];

export default NavItems;
