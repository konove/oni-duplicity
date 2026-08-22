import * as React from "react";

import { Trans } from "react-i18next";

export interface LoadExampleButtonProps {
  onLoadExampleSave(): void;
}
type Props = LoadExampleButtonProps;
const LoadExampleButton: React.FC<Props> = ({ onLoadExampleSave }) => (
  <button onClick={onLoadExampleSave}>
    <Trans i18nKey="save-file.verbs.load_example_titlecase">Load Example</Trans>
  </button>
);

export default LoadExampleButton;
