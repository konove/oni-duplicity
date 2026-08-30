import * as React from "react";

import { WithTranslation, withTranslation, Trans } from "react-i18next";

import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import {
  skillGroupDescKey,
  skillGroupNameKey,
  sortSkillGroupsByName,
} from "@/services/oni-save/skill-groups";

export interface AddAptitudeButtonProps {
  availableAptitudes: string[];
  onAddAptitude(aptitude: string): void;
}

type Props = AddAptitudeButtonProps & WithTranslation;

const AddAptitudeButton: React.FC<Props> = ({
  availableAptitudes,
  onAddAptitude,
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
          color="primary"
          label={t(`duplicant_interest.verbs.add_titlecase`)}
          clickable
          onClick={() => setIsOpen(true)}
        />
      </div>
      <Menu open={isOpen} anchorEl={anchorEl} onClose={() => setIsOpen(false)}>
        {isOpen &&
          sortSkillGroupsByName(availableAptitudes, t, i18n.language).map(
            (trait) => (
              <MenuItem
                key={trait}
                value={trait}
                title={t(skillGroupDescKey(trait), { defaultValue: "" })}
                onClick={() => {
                  setIsOpen(false);
                  onAddAptitude(trait);
                }}
              >
                <Trans i18nKey={skillGroupNameKey(trait)}>{trait}</Trans>
              </MenuItem>
            ),
          )}
      </Menu>
    </div>
  );
};

export default withTranslation()(AddAptitudeButton);
