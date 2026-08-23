import * as React from "react";

import { WithTranslation, withTranslation } from "react-i18next";

import { makeStyles, Theme } from "@/styles";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";

import { useMaterialList } from "@/services/oni-save/hooks/useMaterials";
import { formatMass } from "@/services/oni-save/materials";

import DeleteLooseButton from "./DeleteLooseButton";

export interface MaterialsPageProps {
  className?: string;
}

type Props = MaterialsPageProps & WithTranslation;

const useStyles = makeStyles((theme: Theme) => ({
  searchBox: {
    margin: theme.spacing(),
  },
  row: {
    height: "64px",
  },
}));

const MaterialsTable: React.FC<Props> = ({ className, t }) => {
  const styles = useStyles();
  const materials = useMaterialList();
  const [search, setSearch] = React.useState("");
  const onSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value.toLowerCase());
    },
    [],
  );

  // Materials arrive as SimHashes ids - "SandStone", "CrushedIce" - which is
  // not what the game calls them in any language, English included.
  const materialName = React.useCallback(
    (name: string) => t(`oni:ELEMENTS.${name}.NAME`, { defaultValue: name }),
    [t],
  );

  // Search the displayed name, so it matches what the reader can see.
  const displayMaterials = materials.filter(
    (x) => search === "" || materialName(x.name).toLowerCase().includes(search),
  );

  return (
    <div>
      <TextField
        className={styles.searchBox}
        label={t("verbs.search_titlecase")}
        onChange={onSearchChange}
      />
      <Table className={className} size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t("material.noun_titlecase")}</TableCell>
            <TableCell>
              <DeleteLooseButton />
              {t("material_loose.noun_titlecase")}
            </TableCell>
            <TableCell>{t("material_storage.noun_titlecase")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayMaterials.map(
            ({ name, looseMass, looseCount, storedMass, storedCount }) => (
              <TableRow className={styles.row} key={name}>
                <TableCell>{materialName(name)}</TableCell>
                <TableCell>
                  {looseMass > 0 && (
                    <>
                      <DeleteLooseButton materialType={name} />
                      {formatMass(looseMass, t)}&nbsp;|&nbsp;
                      {t("material_loose.clump_count", { count: looseCount })}
                    </>
                  )}
                </TableCell>
                <TableCell>
                  {storedMass > 0 && (
                    <>
                      {formatMass(storedMass, t)}&nbsp;|&nbsp;
                      {t("material_storage.container_count", {
                        count: storedCount,
                      })}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default withTranslation()(MaterialsTable);
