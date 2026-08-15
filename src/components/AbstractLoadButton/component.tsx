import * as React from "react";

import useLoadFile from "@/services/oni-save/hooks/useLoadFile";

export interface AbstractLoadButtonProps {
  children(props: AbstractLoadButtonRenderProps): React.ReactNode;
}
export interface AbstractLoadButtonRenderProps {
  disabled: boolean;
  onClick(): void;
}

type Props = AbstractLoadButtonProps;
const AbstractLoadButton: React.FC<Props> = ({
  children
}) => {
  const { disabled, onLoadSave } = useLoadFile();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const onClick = React.useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  const onFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) {
        return;
      }
      const file = files[0];

      onLoadSave(file);
    },
    [onLoadSave]
  );

  return (
    <>
      {/* `onClick` reads inputRef only when the consumer invokes it as an
          event handler, never during render. The rule cannot see that through
          the render-prop call, so this is a false positive. */}
      {/* eslint-disable-next-line react-hooks/refs */}
      {children({ disabled, onClick })}
      <input
        ref={inputRef}
        style={{ display: "none" }}
        type="file"
        accept=".sav"
        onChange={onFileChange}
      />
    </>
  );
};

export default AbstractLoadButton;