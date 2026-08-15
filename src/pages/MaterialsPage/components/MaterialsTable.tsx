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

import DeleteLooseButton from "./DeleteLooseButton";

export interface MaterialsPageProps {
  className?: string;
}

type Props = MaterialsPageProps & WithTranslation;

const useStyles = makeStyles((theme: Theme) => ({
  searchBox: {
    margin: theme.spacing()
  },
  row: {
    height: "64px"
  }
}));

const MaterialsTable: React.FC<Props> = ({ className, t }) => {
  const styles = useStyles();
  const materials = useMaterialList();
  const [search, setSearch] = React.useState("");
  const onSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value.toLowerCase());
    },
    []
  );

  function formatWeight(weight: number) {
    if (Math.abs(weight) < 1000) {
      const g = Number(weight.toFixed(2));
      return t("material.gram", { count: g });
    }

    const kg = Number((weight / 1000.0).toFixed(2));
    return t("material.kilogram", { count: kg });
  }

  const displayMaterials = materials.filter(
    x => search === "" || x.name.toLowerCase().indexOf(search) !== -1
  );

  return (
    <div>
      <TextField
        className={styles.searchBox}
        label="Search"
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
            ({ name, looseGrams, looseCount, storedGrams, storedCount }) => (
              <TableRow className={styles.row} key={name}>
                <TableCell>{name}</TableCell>
                <TableCell>
                  {looseGrams > 0 && (
                    <>
                      <DeleteLooseButton materialType={name} />
                      {formatWeight(looseGrams)}&nbsp;|&nbsp;
                      {t("material_loose.clump_count", { count: looseCount })}
                    </>
                  )}
                </TableCell>
                <TableCell>
                  {storedGrams > 0 && (
                    <>
                      {formatWeight(storedGrams)}&nbsp;|&nbsp;
                      {t("material_storage.container_count", {
                        count: storedCount
                      })}
                    </>
                  )}
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default withTranslation()(MaterialsTable);
