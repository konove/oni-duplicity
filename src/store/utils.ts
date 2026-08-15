import { UnknownAction } from "redux";

export type Reducer<TState> = (
  state: TState | undefined,
  action: UnknownAction
) => TState;
export function reduceReducers<TState>(
  ...reducers: Reducer<TState>[]
): Reducer<TState> {
  return (state: TState | undefined, action: UnknownAction) => {
    const result = reducers.reduce(
      (state, reducer) => reducer(state, action),
      state
    );
    return result!;
  };
}
