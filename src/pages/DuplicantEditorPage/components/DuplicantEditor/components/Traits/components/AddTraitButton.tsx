import * as React from "react";

import { WithTranslation, withTranslation, Trans } from "react-i18next";

import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export interface AddTraitButtonProps {
  availableTraits: string[];
  className?: string;
  onAddTrait(trait: string): void;
}

type Props = AddTraitButtonProps & WithTranslation;

const AddTraitButton: React.FC<Props> = ({
  className,
  availableTraits,
  onAddTrait,
  t
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  // A callback ref into state rather than a useRef: the Menu needs the anchor
  // during render, and reading `ref.current` there can position against a
  // stale node.
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);
  return (
    <div className={className}>
      <div ref={setAnchorEl}>
        <Chip
          color="primary"
          label={t(`duplicant_trait.verbs.add_titlecase`)}
          clickable
          onClick={() => setIsOpen(true)}
        />
      </div>
      <Menu
        open={isOpen}
        anchorEl={anchorEl}
        onClose={() => setIsOpen(false)}
      >
        {isOpen &&
          [...availableTraits].sort().map(trait => (
            <MenuItem
              key={trait}
              value={trait}
              title={t(`oni:DUPLICANTS.TRAITS.${trait.toUpperCase()}.DESC`, {
                defaultValue: ""
              })}
              onClick={() => {
                setIsOpen(false);
                onAddTrait(trait);
              }}
            >
              <Trans
                i18nKey={`oni:DUPLICANTS.TRAITS.${trait.toUpperCase()}.NAME`}
              >
                {trait}
              </Trans>
            </MenuItem>
          ))}
      </Menu>
    </div>
  );
};

export default withTranslation()(AddTraitButton);
