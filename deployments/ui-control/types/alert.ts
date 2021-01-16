export interface Alert {
  readonly type: string;
  message: string | null | undefined;
  color?: string;
}
