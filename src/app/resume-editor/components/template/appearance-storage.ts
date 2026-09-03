import { DEFAULT_TEMPLATE_ID, getTemplate, TEMPLATES } from "./registry";

/**
 * Where the chosen template and tint live between visits, and what counts as a
 * usable pair once they come back.
 *
 * Two surfaces read this key, which is why it is here rather than inside the
 * editor's hook: the editor owns the choice and writes it, and the landing page
 * seeds its own preview from it so a returning visitor's link into the editor
 * carries what they last picked instead of resetting them to Classic.
 */

export const APPEARANCE_STORAGE_KEY = "resume-appearance";

export interface Appearance {
  templateId: string;
  backgroundColor: string;
}

export const defaultAppearance = (id: string = DEFAULT_TEMPLATE_ID): Appearance => ({
  templateId: id,
  backgroundColor: getTemplate(id).defaultColor,
});

/**
 * What comes back out of storage, which is not to be trusted: it was written by an
 * older release, or hand-edited, or belongs to a template that has since been
 * removed from the registry.
 *
 * A stale `templateId` is the interesting case. `getTemplate` already falls back
 * to Classic for an unknown id, but the stored colour would then be one chosen for
 * a template nobody can see any more — so the pair is discarded together rather
 * than half-honoured.
 */
export const isAppearance = (value: unknown): value is Appearance => {
  if (typeof value !== "object" || value === null) return false;

  const { templateId, backgroundColor } = value as Partial<Appearance>;

  return (
    typeof backgroundColor === "string" &&
    backgroundColor !== "" &&
    TEMPLATES.some((template) => template.id === templateId)
  );
};
