export type IsoTimestamp = string;

export type EventEnvelope<TType extends string = string, TData = unknown> = {
  seq: number;
  ts: IsoTimestamp;
  type: TType;
  data: TData;
};
