import { z } from "zod";

// coerce numbers that may arrive as strings from SQL
const Numeric = z.preprocess((val) => {
  if (typeof val === "string" && val.trim() !== "") return Number(val);
  return val;
}, z.number());

export const StepSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  step_order: Numeric.optional(),
});

export const WorkflowVersionSchema = z.object({
  id: z.string(),
  workflow_id: z.string().optional(),
  version_number: Numeric.optional(),
  snapshot: z.any().optional(),
});

export const ItemSchema = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  item_type: z.string().optional(),
  item_status: z.string().optional(),
  workflow_version_id: z.string().nullable().optional(),
  workflow_data: z.any().optional(), // snapshot->>'workflow' content
  completed_steps: Numeric.optional(),
  total_steps: Numeric.optional(),
  created_at: z.string().optional(),
});

// JS projects: remove TypeScript `export type` lines.
// If you want IDE hints, add JSDoc typedefs here.

/**
 * Validate an array of items returned from SQL.
 * @param {unknown} rows
 * @returns {Array<object>}
 */
export function validateItems(rows) {
  return z.array(ItemSchema).parse(rows);
}

/**
 * Validate an array of workflow versions returned from SQL.
 * @param {unknown} rows
 * @returns {Array<object>}
 */
export function validateWorkflowVersions(rows) {
  return z.array(WorkflowVersionSchema).parse(rows);
}

/**
 * Validate snapshot shape and return steps array.
 * @param {unknown} snapshot
 * @returns {Array<object>}
 */
export function validateSnapshotSteps(snapshot) {
  const s = z.object({ steps: z.array(StepSchema).optional() }).parse(snapshot);
  return s.steps ?? [];
}
