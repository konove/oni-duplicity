type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : DeepPartial<T[P]>;
};

type ArrayValues<T> = T extends Array<infer U> ? U : never;

type PropsOfComponent<T> = T extends React.Component<infer P> ? P : never;

interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
  __REDUX_DEVTOOLS_EXTENSION__?: any;
  loadMockSave?: () => void;
  loadMockError?: () => void;
}

declare module "@changelog" {
  const content: string;
  export = content;
}

// Stylesheets are handled by webpack's css/style loaders and imported purely
// for their side effect.
declare module "*.css";
