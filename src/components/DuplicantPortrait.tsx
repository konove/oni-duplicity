import * as React from "react";

import { Trans, useTranslation } from "react-i18next";
import {
  AccessorizerBehavior,
  getAccessoryOfType,
  Accessory,
  AccessoryType,
} from "oni-save-parser";

import { createStyles, withStyles, WithStyles } from "@/styles";

import {
  DuplicantContainer,
  Hair,
  Head,
  Eyes,
  isValidHead,
  isValidHair,
  isValidEyes,
} from "@/components/duplicant";
import useBehavior from "@/services/oni-save/hooks/useBehavior";

export interface DuplicantPortraitProps {
  gameObjectId: number;
  /** Multiplies PORTRAIT_WIDTH and PORTRAIT_HEIGHT below. */
  scale: number;
}

// The sprite layers are drawn for a whole duplicant, but only the head, eyes
// and hair are ever mounted here - so a box sized for the body left the head
// sitting in the top two thirds with dead space under it, which reads as a
// portrait that is not centred.
//
// These are the same framing numbers HeadPortrait uses for the appearance
// picker, where they were tuned against all 33 hairstyles: a 110x100 box at
// scale .4, with the sprite anchored at 56,85. Expressed here at scale 1 so
// the two components frame a head identically.
const PORTRAIT_WIDTH = 275;
const PORTRAIT_HEIGHT = 250;
const SPRITE_LEFT = 140;
const SPRITE_TOP = 212.5;

const styles = createStyles({
  portraitContainer: {
    position: "relative",
  },
  portrait: {
    position: "absolute",
    width: 0,
    height: 0,
    transformOrigin: "top left",
  },
  placeholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    opacity: 0.4,
  },
});

type Props = DuplicantPortraitProps & WithStyles<typeof styles>;

const DuplicantPortrait: React.FC<Props> = ({
  classes,
  gameObjectId,
  scale,
}) => {
  const { t } = useTranslation();
  const { templateData } = useBehavior(gameObjectId, AccessorizerBehavior);
  if (!templateData) {
    return (
      <div>
        <Trans i18nKey="conditions.no_data">Error: No Data</Trans>
      </div>
    );
  }

  // These sprites predate several content packs, and a bionic duplicant in
  // particular uses parts well past the highest asset shipped - hair_035
  // against a maximum of hair_033, for instance. The leaf components already
  // decline to draw an ordinal they have no art for, so rather than render a
  // duplicant missing its head, check first and show a placeholder.
  const head = ordinalOfType(templateData.accessories, "headshape");
  const eyes = ordinalOfType(templateData.accessories, "eyes");
  const hair = ordinalOfType(templateData.accessories, "hair");
  const canDraw =
    head != null &&
    eyes != null &&
    hair != null &&
    isValidHead(head) &&
    isValidEyes(eyes) &&
    isValidHair(hair);

  if (!canDraw) {
    return (
      <div
        className={classes.portraitContainer}
        style={{
          width: PORTRAIT_WIDTH * scale,
          height: PORTRAIT_HEIGHT * scale,
        }}
        title={t("duplicant.conditions.no_portrait")}
      >
        <div className={classes.placeholder}>
          <svg viewBox="0 0 24 24" width={120 * scale} height={120 * scale}>
            <path
              fill="currentColor"
              d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5Z"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      className={classes.portraitContainer}
      // The box the sprite is framed in, which e2e measures the paint against.
      data-duplicant-portrait
      style={{
        width: PORTRAIT_WIDTH * scale,
        height: PORTRAIT_HEIGHT * scale,
      }}
    >
      <div
        className={classes.portrait}
        style={{
          left: SPRITE_LEFT * scale,
          top: SPRITE_TOP * scale,
          transform: `scale(${scale})`,
        }}
      >
        <DuplicantContainer>
          <Head ordinal={head} />
          <Eyes ordinal={eyes} />
          <Hair ordinal={hair} />
        </DuplicantContainer>
      </div>
    </div>
  );
};
export default withStyles(styles)(DuplicantPortrait);

/**
 * The sprite index encoded in an accessory resource name, e.g.
 * "Root.Accessories.hair_017" is 17. Returns null when the duplicant has no
 * accessory of that type, or when the name does not end in a number.
 */
function ordinalOfType(accessories: Accessory[], type: AccessoryType) {
  const accessory = getAccessoryOfType(accessories, type);
  if (!accessory) {
    return null;
  }

  const name = accessory.guid.Guid.split(".").pop() || "";
  const ordinal = Number(name.split("_").pop());
  return Number.isFinite(ordinal) ? ordinal : null;
}
