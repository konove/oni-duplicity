import * as React from "react";

import { WithTranslation, withTranslation } from "react-i18next";

import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import { skillName } from "@/services/oni-save/skills";

export interface AddSkillButtonProps {
  availableSkills: string[];
  onAddSkill(skillId: string): void;
}

type Props = AddSkillButtonProps & WithTranslation;

const AddSkillButton: React.FC<Props> = ({
  availableSkills,
  onAddSkill,
  t,
  i18n,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  // A callback ref into state rather than a useRef: the Menu needs the anchor
  // during render, and reading `ref.current` there can position against a
  // stale node.
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);

  // Fifty-four skills is too many to scan unsorted, and they are named for
  // what they do rather than for their ids.
  const collator = new Intl.Collator(i18n.language, { sensitivity: "base" });
  const ordered = [...availableSkills].sort((a, b) =>
    collator.compare(skillName(a, t), skillName(b, t)),
  );

  return (
    <div>
      <div ref={setAnchorEl}>
        <Chip
          size="small"
          color="primary"
          label={t("duplicant_skills.verbs.add_titlecase", {
            defaultValue: "Add skill",
          })}
          clickable
          onClick={() => setIsOpen(true)}
        />
      </div>
      <Menu open={isOpen} anchorEl={anchorEl} onClose={() => setIsOpen(false)}>
        {isOpen &&
          ordered.map((skillId) => (
            <MenuItem
              key={skillId}
              value={skillId}
              onClick={() => {
                setIsOpen(false);
                onAddSkill(skillId);
              }}
            >
              {skillName(skillId, t)}
            </MenuItem>
          ))}
      </Menu>
    </div>
  );
};

export default withTranslation()(AddSkillButton);
