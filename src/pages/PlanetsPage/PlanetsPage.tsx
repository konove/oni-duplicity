import React from "react";
import { DLCIds } from "oni-save-parser";
import { Navigate } from "react-router";

import PageContainer from "@/components/PageContainer";
import RedirectIfNoSave from "@/components/RedirectIfNoSave";
import RequireDLC from "@/components/RequireDLC";

import PlanetList from "./components/PlanetList";

const PlanetsPage: React.FC = () => (
  <PageContainer title="Planets">
    <RedirectIfNoSave />
    <RequireDLC dlcId={DLCIds.None} fallback={<Navigate to="/" replace />}>
      <PlanetList />
    </RequireDLC>
  </PageContainer>
);

export default PlanetsPage;
