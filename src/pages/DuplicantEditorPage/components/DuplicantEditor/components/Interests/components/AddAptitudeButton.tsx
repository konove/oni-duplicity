import * as React from "react";

import { WithTranslation, withTranslation, Trans } from "react-i18next";

import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export interface AddAptitudeButtonProps {
  availableAptitudes: string[];
  className?: string;
  onAddAptitude(aptitude: string): void;
}

type Props = AddAptitudeButtonProps & WithTranslation;

const AddAptitudeButton: React.FC<Props> = ({
  className,
  availableAptitudes,
  onAddAptitude,
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
          label={t(`duplicant_interest.verbs.add_titlecase`)}
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
          [...availableAptitudes].sort().map(trait => (
            <MenuItem
              key={trait}
              value={trait}
              title={t(`oni:DUPLICANTS.APTITUDES.${trait.toUpperCase()}.DESC`, {
                defaultValue: ""
              })}
              onClick={() => {
                setIsOpen(false);
                onAddAptitude(trait);
              }}
            >
              <Trans
                i18nKey={`oni:DUPLICANTS.APTITUDES.${trait.toUpperCase()}.NAME`}
              >
                {trait}
              </Trans>
            </MenuItem>
          ))}
      </Menu>
    </div>
  );
};

export default withTranslation()(AddAptitudeButton);
