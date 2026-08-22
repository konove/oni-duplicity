import * as React from "react";

import { Trans } from "react-i18next";

import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

export interface ExperienceProps {
  experience: number;
  setExperience(experience: number): void;
}

const Experience: React.FC<ExperienceProps> = ({
  experience,
  setExperience,
}) => {
  const onSetExperience = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setExperience(Number(e.target.value));
    },
    [setExperience],
  );

  return (
    <div>
      <Typography>
        <Trans i18nKey="duplicant_skills.experience_titlecase">
          Experience
        </Trans>
      </Typography>
      <TextField type="number" value={experience} onChange={onSetExperience} />
    </div>
  );
};

export default Experience;
