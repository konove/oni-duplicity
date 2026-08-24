import * as React from "react";
import { SimHashName } from "oni-save-parser";
import { useTranslation } from "react-i18next";

import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import { useDeleteMaterials } from "@/services/oni-save/hooks/useMaterials";
import { formatQuantity } from "@/services/oni-save/materials";
import { MaterialListItem } from "@/services/oni-save/selectors/material";

import ConfirmationDialog from "@/components/ConfirmationDialog";

export interface MaterialActionsMenuProps {
  /** The row this menu acts on; omitted for the whole-table menu. */
  material?: MaterialListItem;
  /** What to call this material, already resolved for display. */
  label: string;
}

/**
 * One overflow menu per row, holding every action that row has.
 *
 * Each entry names its own quantity - "Delete 197.4 t lying around" - which is
 * the whole point of the affordance. A trailing delete button sat at the row
 * level while the action belonged to one part of the row, so nothing said
 * whether it took Shale's loose 197.4 t or its stored 200 kg.
 *
 * Entries that do not apply are omitted rather than disabled, and a menu with
 * no entries is not rendered at all.
 */
const MaterialActionsMenu: React.FC<MaterialActionsMenuProps> = ({
  material,
  label,
}) => {
  const { t } = useTranslation();
  const onDeleteMaterial = useDeleteMaterials();
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const close = React.useCallback(() => setAnchor(null), []);
  const onDeleteLoose = React.useCallback(() => {
    close();
    onDeleteMaterial(material ? (material.name as SimHashName) : undefined);
  }, [close, onDeleteMaterial, material]);

  const looseLabel = material
    ? t("material_loose.verbs.delete_amount", {
        amount: formatQuantity(
          material.measure,
          material.kind,
          material.name,
          material.looseUnits,
          t,
        ),
      })
    : t("material_loose.verbs.delete_all");

  // Nothing lying around is nothing to delete. Once containers can be emptied
  // (2.6) this becomes one of two entries rather than the only one.
  const hasLoose = !material || material.looseUnits > 0;
  if (!hasLoose) {
    return null;
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label={t("material.actions_label", { name: label })}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={close}>
        <ConfirmationDialog
          title={t("material_loose.verbs.delete_name", { name: label })}
          message={t("material_loose.prompts.delete")}
          onConfirm={onDeleteLoose}
        >
          {({ onClick }) => <MenuItem onClick={onClick}>{looseLabel}</MenuItem>}
        </ConfirmationDialog>
      </Menu>
    </>
  );
};

export default MaterialActionsMenu;
