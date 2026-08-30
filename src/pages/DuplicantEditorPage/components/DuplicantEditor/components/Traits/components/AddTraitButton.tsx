import * as React from "react";

import { WithTranslation, withTranslation, Trans } from "react-i18next";

import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import {
  sortTraitIdsByName,
  traitTooltip,
  traitNameKey,
} from "@/services/oni-save/traits";

export interface AddTraitButtonProps {
  availableTraits: string[];
  onAddTrait(trait: string): void;
}

type Props = AddTraitButtonProps & WithTranslation;

const AddTraitButton: React.FC<Props> = ({
  availableTraits,
  onAddTrait,
  t,
  i18n,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  // A callback ref into state rather than a useRef: the Menu needs the anchor
  // during render, and reading `ref.current` there can position against a
  // stale node.
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);
  return (
    <div>
      <div ref={setAnchorEl}>
        <Chip
          size="small"
          color="primary"
          label={t(`duplicant_trait.verbs.add_titlecase`)}
          clickable
          onClick={() => setIsOpen(true)}
        />
      </div>
      <Menu open={isOpen} anchorEl={anchorEl} onClose={() => setIsOpen(false)}>
        {isOpen &&
          sortTraitIdsByName(availableTraits, t, i18n.language).map((trait) => (
            <MenuItem
              key={trait}
              value={trait}
              title={traitTooltip(trait, t)}
              onClick={() => {
                setIsOpen(false);
                onAddTrait(trait);
              }}
            >
              <Trans i18nKey={traitNameKey(trait)}>{trait}</Trans>
            </MenuItem>
          ))}
      </Menu>
    </div>
  );
};

export default withTranslation()(AddTraitButton);
