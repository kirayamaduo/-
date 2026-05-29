/** JD-tailored copies are saved with a `_tailored` suffix (see ResumeGenController). */
export const isTailoredResumeTitle = (title?: string | null): boolean => {
  if (!title) return false;
  return /_tailored(?:\.pdf)?$/i.test(title.trim());
};
