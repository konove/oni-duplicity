/**
 * The blob inside `StateMachineController`.
 *
 * A duplicant's death is not a field anywhere. It is a state machine state:
 * `DeathMonitor` is a `GameStateMachine` marked
 * `serializable = SerializeType.Both_DEPRECATED`, so both its current state and
 * its parameters persist, and a dead duplicant sits in `root.dead.ground` with
 * a `death` parameter naming the cause.
 *
 * `StateMachineController.Serialize` hands off to `StateMachineSerializer`,
 * which writes its own binary format rather than reflected fields. That is why
 * the behavior's type template declares no fields at all, and why
 * `oni-save-parser` keeps the bytes as an opaque `extraRaw` - there is nothing
 * in the save's own type table for it to describe them with.
 *
 * The format, transcribed from `StateMachineSerializer`:
 *
 *   int32          serializer version (20 at time of writing)
 *   int32          length of everything after this field
 *   int32          entry count
 *   per entry:
 *     int32        always 0 - written as a placeholder and never patched, and
 *                  `Entry.Deserialize` reads and discards it
 *     klei string  state machine type name
 *     klei string  serialization suffix, only when the version has one
 *     klei string  current state name
 *     int32        length of the data that follows
 *     bytes        `SerializeTypeless(smi)` output, then the parameter block
 *
 * and the parameter block, for a machine whose `serializable` includes its
 * parameters:
 *
 *   int32          parameter count
 *   per parameter:
 *     int32        length of everything after this field, for this parameter
 *     klei string  parameter context type name
 *     klei string  parameter name
 *     bytes        the value
 *
 * A klei string is an int32 length then that many UTF-8 bytes; -1 is null.
 */

const DEAD_STATE_PREFIX = "root.dead";

/** `DeathMonitor.InitializeStates` names the living state exactly this. */
export const ALIVE_STATE = "root.alive";

export const DEATH_MONITOR = "DeathMonitor+Instance";

/**
 * `ResourceParameter.Context.Serialize` writes the resource's guid as a klei
 * string, and the empty string when there is no resource. `Deserialize` only
 * takes the value when the string is non-empty, so this is how "nobody died"
 * is spelled.
 */
export const NO_DEATH = "";

export const DEATH_PARAMETER = "death";

export interface StateMachineParameter {
  contextType: string | null;
  name: string | null;
  /** Everything after the name, left alone unless something asks to change it. */
  value: Uint8Array;
}

export interface StateMachineEntry {
  leading: number;
  type: string | null;
  suffix: string | null;
  currentState: string | null;
  data: Uint8Array;
}

export interface StateMachineBlob {
  version: number;
  entries: StateMachineEntry[];
}

/** Versions before 12 use a different layout this does not read. */
const OLDEST_READABLE_VERSION = 12;

function hasTypeSuffix(version: number): boolean {
  return version < 20 ? version === 11 : true;
}

class Reader {
  private offset = 0;

  constructor(
    private readonly bytes: Uint8Array,
    private readonly view: DataView,
  ) {}

  static of(bytes: Uint8Array): Reader {
    return new Reader(
      bytes,
      new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    );
  }

  get position(): number {
    return this.offset;
  }

  get remaining(): number {
    return this.bytes.byteLength - this.offset;
  }

  int32(): number {
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  string(): string | null {
    const length = this.int32();
    if (length < 0) {
      return null;
    }
    const slice = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder("utf-8").decode(slice);
  }

  take(length: number): Uint8Array {
    const slice = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }
}

class Writer {
  private readonly chunks: Uint8Array[] = [];
  length = 0;

  int32(value: number): void {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, value, true);
    this.push(bytes);
  }

  string(value: string | null): void {
    if (value == null) {
      this.int32(-1);
      return;
    }
    const bytes = new TextEncoder().encode(value);
    this.int32(bytes.byteLength);
    this.push(bytes);
  }

  push(bytes: Uint8Array): void {
    this.chunks.push(bytes);
    this.length += bytes.byteLength;
  }

  concat(): Uint8Array {
    const out = new Uint8Array(this.length);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return out;
  }
}

/**
 * Returns null rather than a partial answer for anything unexpected - a
 * version this does not know, a length that overruns, bytes left over at the
 * end. Everything downstream treats null as "leave these bytes alone", which
 * is the only safe default when the alternative is writing a corrupt save.
 */
export function decodeStateMachines(
  buffer: ArrayBuffer | null | undefined,
): StateMachineBlob | null {
  if (!buffer || buffer.byteLength < 12) {
    return null;
  }

  try {
    const reader = Reader.of(new Uint8Array(buffer));
    const version = reader.int32();
    const totalLength = reader.int32();
    if (version < OLDEST_READABLE_VERSION) {
      return null;
    }
    // The length covers the entry count and every entry, and nothing follows.
    if (totalLength !== buffer.byteLength - 8) {
      return null;
    }

    const count = reader.int32();
    const entries: StateMachineEntry[] = [];
    for (let i = 0; i < count; i++) {
      const leading = reader.int32();
      const type = reader.string();
      const suffix = hasTypeSuffix(version) ? reader.string() : null;
      const currentState = reader.string();
      const dataLength = reader.int32();
      if (dataLength < 0 || dataLength > reader.remaining) {
        return null;
      }
      entries.push({
        leading,
        type,
        suffix,
        currentState,
        data: reader.take(dataLength),
      });
    }

    if (reader.remaining !== 0) {
      return null;
    }
    return { version, entries };
  } catch {
    return null;
  }
}

export function encodeStateMachines(blob: StateMachineBlob): ArrayBuffer {
  const body = new Writer();
  body.int32(blob.entries.length);
  for (const entry of blob.entries) {
    body.int32(entry.leading);
    body.string(entry.type);
    if (hasTypeSuffix(blob.version)) {
      body.string(entry.suffix);
    }
    body.string(entry.currentState);
    body.int32(entry.data.byteLength);
    body.push(entry.data);
  }

  const out = new Writer();
  out.int32(blob.version);
  out.int32(body.length);
  out.push(body.concat());

  const bytes = out.concat();
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

/**
 * The parameter block of one entry's data.
 *
 * `SerializeTypeless(smi)` runs before it, so this only works for a machine
 * whose instance serializes no fields of its own - `DeathMonitor.Instance` is
 * one, and the parse is checked to consume the data exactly, so a machine that
 * is not returns null rather than nonsense.
 */
export function decodeParameters(
  data: Uint8Array,
): StateMachineParameter[] | null {
  if (data.byteLength < 4) {
    return null;
  }

  try {
    const reader = Reader.of(data);
    const count = reader.int32();
    if (count < 0) {
      return null;
    }
    const parameters: StateMachineParameter[] = [];
    for (let i = 0; i < count; i++) {
      const length = reader.int32();
      if (length < 0 || length > reader.remaining) {
        return null;
      }
      const start = reader.position;
      const contextType = reader.string();
      const name = reader.string();
      const consumed = reader.position - start;
      if (consumed > length) {
        return null;
      }
      parameters.push({
        contextType,
        name,
        value: reader.take(length - consumed),
      });
    }
    if (reader.remaining !== 0) {
      return null;
    }
    return parameters;
  } catch {
    return null;
  }
}

export function encodeParameters(
  parameters: StateMachineParameter[],
): Uint8Array {
  const out = new Writer();
  out.int32(parameters.length);
  for (const parameter of parameters) {
    const body = new Writer();
    body.string(parameter.contextType);
    body.string(parameter.name);
    body.push(parameter.value);
    out.int32(body.length);
    out.push(body.concat());
  }
  return out.concat();
}

/** A klei string on its own, which is how a resource parameter's value is written. */
export function encodeResourceValue(guid: string): Uint8Array {
  const writer = new Writer();
  writer.string(guid);
  return writer.concat();
}

export function findDeathMonitor(
  blob: StateMachineBlob,
): StateMachineEntry | undefined {
  return blob.entries.find((entry) => entry.type === DEATH_MONITOR);
}

/**
 * Whether these bytes describe a dead duplicant.
 *
 * `root.dead` has two children, `ground` and `carried` - a body someone has
 * picked up is still a body - so this matches the branch rather than a leaf.
 */
export function isDeadStateMachines(
  buffer: ArrayBuffer | null | undefined,
): boolean {
  const blob = decodeStateMachines(buffer);
  if (!blob) {
    return false;
  }
  const monitor = findDeathMonitor(blob);
  return (
    monitor != null &&
    (monitor.currentState || "").startsWith(DEAD_STATE_PREFIX)
  );
}

/**
 * The two edits that undo a death, or null when there is nothing to undo or
 * the bytes are not shaped the way this understands.
 *
 * Both are needed. `DeathMonitor.InitializeStates` wires
 * `alive.ParamTransition(death, dying_duplicant, (smi, p) => p != null && ...)`,
 * so a duplicant put back in `root.alive` with the parameter still set walks
 * straight back into dying on the first tick.
 */
export function reviveStateMachines(
  buffer: ArrayBuffer | null | undefined,
): ArrayBuffer | null {
  const blob = decodeStateMachines(buffer);
  if (!blob) {
    return null;
  }

  const monitor = findDeathMonitor(blob);
  if (!monitor || !(monitor.currentState || "").startsWith(DEAD_STATE_PREFIX)) {
    return null;
  }

  const parameters = decodeParameters(monitor.data);
  if (!parameters) {
    return null;
  }
  const death = parameters.find((p) => p.name === DEATH_PARAMETER);
  if (!death) {
    return null;
  }

  const revived: StateMachineBlob = {
    version: blob.version,
    entries: blob.entries.map((entry) =>
      entry === monitor
        ? {
            ...entry,
            currentState: ALIVE_STATE,
            data: encodeParameters(
              parameters.map((p) =>
                p === death
                  ? { ...p, value: encodeResourceValue(NO_DEATH) }
                  : p,
              ),
            ),
          }
        : entry,
    ),
  };

  return encodeStateMachines(revived);
}
