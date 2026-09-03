"use client";

import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { useReadLocalStorage } from "usehooks-ts";

import {
  APPEARANCE_STORAGE_KEY,
  isAppearance,
} from "@/app/resume-editor/components/template/appearance-storage";
import { DEFAULT_TEMPLATE_ID } from "@/app/resume-editor/components/template/registry";

/**
 * The template and the tint the visitor is trying out. Both reach the sheet as
 * props — see `template-sheet.tsx` — and neither leaves it.
 *
 * The tint used to be published as `--ink` on the page wrapper and drive the
 * whole page's accent as well. It no longer does: the swatch is a preview of a
 * printed page, not a theme picker, and a site that repainted itself every time
 * someone clicked through six colours read as unstable rather than responsive.
 * The page's accent is fixed in globals.css as `--accent`.
 */

export interface Swatch {
  name: string;
  value: string;
}

/** Deliberately all mid-to-dark: every one has to hold a sidebar of white type on
 *  white paper. Pine and Ink are two of the templates' own defaults, and Pine is
 *  also the page's fixed accent — if it changes here, change `--c-accent` in
 *  globals.css with it (it is an HSL triple there, not a hex). */
export const SWATCHES: Swatch[] = [
  { name: "Pine", value: "#094C42" },
  { name: "Ink", value: "#02061b" },
  { name: "Oxblood", value: "#6E1F2B" },
  { name: "Indigo", value: "#2A3A8F" },
  { name: "Ochre", value: "#8A5A12" },
  { name: "Slate", value: "#3C4A52" },
];

interface AccentValue {
  templateId: string;
  color: string;
  setTemplateId: (id: string) => void;
  setColor: (color: string) => void;
}

const AccentContext = createContext<AccentValue | null>(null);

export const useAccent = () => {
  const value = useContext(AccentContext);
  if (!value) throw new Error("useAccent must be used inside <AccentProvider>");
  return value;
};

const AccentProvider = ({ children }: PropsWithChildren) => {
  /*
    What the visitor last chose in the editor, if they have been here before. The
    page reads that key and never writes it: the editor owns the choice, and the
    landing page is only borrowing it so a returning visitor's sheet — and the
    link into the editor it sits beside, which carries the pair in its query
    string — shows their template rather than resetting them to Classic.

    Null on the server and on the first client render, so the sheet starts on the
    default and swaps once storage has been read. Nothing here can be rendered on
    the server, and gating the whole page on a mounted flag to avoid the swap
    would cost the hero its server-rendered first paint.
  */
  const stored = useReadLocalStorage<unknown>(APPEARANCE_STORAGE_KEY);
  const remembered = isAppearance(stored) ? stored : null;

  /* Empty until the visitor picks something on this page, which is what lets the
     remembered pair sit underneath as the fallback: a `useState` seeded from
     storage would have to be seeded in an effect, and that effect would overwrite
     a click that happened first. */
  const [picked, setPicked] = useState<{ templateId?: string; color?: string }>({});

  const templateId = picked.templateId ?? remembered?.templateId ?? DEFAULT_TEMPLATE_ID;
  const color = picked.color ?? remembered?.backgroundColor ?? SWATCHES[0].value;

  const value = useMemo(
    () => ({
      templateId,
      color,
      setTemplateId: (id: string) => setPicked((current) => ({ ...current, templateId: id })),
      setColor: (next: string) => setPicked((current) => ({ ...current, color: next })),
    }),
    [templateId, color],
  );

  return (
    <AccentContext.Provider value={value}>
      <div
        data-landing
        className="min-h-screen bg-[var(--paper)] font-body text-[var(--graphite)] transition-colors duration-500"
      >
        {children}
      </div>
    </AccentContext.Provider>
  );
};

export default AccentProvider;
