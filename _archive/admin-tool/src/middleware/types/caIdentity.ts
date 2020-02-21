export interface CaIdentity {
  id: string;
  type: string;
  affiliation: string;
  attrs: Array<{ name: string; value: string; ecert?: boolean }>;
  max_enrollments: number;
}
