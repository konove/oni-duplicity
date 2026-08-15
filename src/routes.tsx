import * as React from "react";

import { Routes as RouterRoutes, Route, Navigate } from "react-router";

import OverviewPage from "@/pages/OverviewPage";
import DuplicantsPage from "@/pages/DuplicantsPage";
import DuplicantEditorPage from "@/pages/DuplicantEditorPage";
import CreaturesPage from "@/pages/CreaturesPage";
import CreatureEditorPage from "@/pages/CreatureEditorPage";
import GeysersPage from "@/pages/GeysersPage";
import WorldsPage from "@/pages/WorldsPage";
import MaterialsPage from "@/pages/MaterialsPage";
import RawEditorPage from "@/pages/RawEditorPage";
import SettingsPage from "@/pages/SettingsPage";
import ChangelogPage from "@/pages/ChangelogPage";

const Routes: React.FC = () => (
  <RouterRoutes>
    <Route path="/" element={<OverviewPage />} />
    <Route path="/duplicants" element={<DuplicantsPage />} />
    <Route path="/duplicants/:gameObjectId" element={<DuplicantEditorPage />} />
    <Route path="/creatures" element={<CreaturesPage />} />
    <Route path="/creatures/:gameObjectId" element={<CreatureEditorPage />} />
    <Route path="/geysers" element={<GeysersPage />} />
    <Route path="/worlds" element={<WorldsPage />} />
    <Route path="/materials" element={<MaterialsPage />} />
    <Route path="/raw" element={<RawEditorPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/changelog" element={<ChangelogPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </RouterRoutes>
);
export default Routes;
