import * as React from "react";
import { useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Typography from "@mui/material/Typography";

import { useMaterialList } from "@/services/oni-save/hooks/useMaterials";
import {
  formatQuantity,
  kindKey,
  looseObjectKey,
  materialDisplayName,
} from "@/services/oni-save/materials";
import { MaterialListItem } from "@/services/oni-save/selectors/material";

import MaterialActionsMenu from "./MaterialActionsMenu";

export interface MaterialsTableProps {
  className?: string;
}

type Translator = (key: string, options?: any) => string;

/**
 * A quantity with the line that says what it is made of.
 *
 * The amount is the unit the game measures this material in; the note under it
 * says how many things that is - clumps, bottles, canisters, containers - or,
 * for a material already counted in things, simply where they are.
 */
const Quantity: React.FC<{ amount: string; note: string }> = ({
  amount,
  note,
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
    <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
      {amount}
    </Typography>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontVariantNumeric: "tabular-nums" }}
    >
      {note}
    </Typography>
  </Box>
);

const Empty: React.FC = () => (
  <Typography variant="body2" color="text.secondary">
    &mdash;
  </Typography>
);

function looseNote(material: MaterialListItem, t: Translator): string {
  const key = looseObjectKey(material.kind, material.name);
  return key === "material_loose.lying_around"
    ? t(key)
    : t(key, { count: material.looseObjects });
}

const MaterialsTable: React.FC<MaterialsTableProps> = ({ className }) => {
  const { t } = useTranslation();
  const materials = useMaterialList();
  const [search, setSearch] = React.useState("");

  // Materials arrive as prefab ids - "SandStone", "SeaLettuceSeed" - which is
  // not what the game calls them in any language, English included.
  const nameOf = React.useCallback(
    (material: MaterialListItem) =>
      materialDisplayName(material.name, material.kind, t),
    [t],
  );

  // Search and sort by the displayed name, so both match what the reader can
  // see. Sorting by the prefab id looks like no order at all once the names
  // come from the catalogue: SeaLettuceSeed sorts under S and reads
  // "Waterweed Seed".
  const shown = materials
    .map((material) => ({ material, label: nameOf(material) }))
    .filter(
      ({ label }) => search === "" || label.toLowerCase().includes(search),
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <TextField
        sx={{ m: 1 }}
        label={t("verbs.search_titlecase")}
        onChange={(e) => setSearch(e.target.value.toLowerCase())}
      />
      <Table className={className} size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 280 }}>
              {t("material.noun_titlecase")}
            </TableCell>
            <TableCell>{t("material_loose.noun_titlecase")}</TableCell>
            <TableCell>{t("material_storage.noun_titlecase")}</TableCell>
            <TableCell padding="checkbox" align="right">
              <MaterialActionsMenu label={t("material.all_titlecase")} />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {shown.map(({ material, label }) => {
            return (
              <TableRow key={material.name}>
                <TableCell>
                  <Typography variant="body2">{label}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                  >
                    {t(kindKey(material.kind, material.name))}
                  </Typography>
                </TableCell>
                <TableCell>
                  {material.looseUnits > 0 ? (
                    <Quantity
                      amount={formatQuantity(
                        material.measure,
                        material.kind,
                        material.name,
                        material.looseUnits,
                        t,
                      )}
                      note={looseNote(material, t)}
                    />
                  ) : (
                    <Empty />
                  )}
                </TableCell>
                <TableCell>
                  {material.storedUnits > 0 ? (
                    <Quantity
                      amount={formatQuantity(
                        material.measure,
                        material.kind,
                        material.name,
                        material.storedUnits,
                        t,
                      )}
                      note={t("material_storage.container_count", {
                        count: material.storedContainers,
                      })}
                    />
                  ) : (
                    <Empty />
                  )}
                </TableCell>
                <TableCell padding="checkbox" align="right">
                  <MaterialActionsMenu material={material} label={label} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MaterialsTable;
