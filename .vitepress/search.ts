// Search tuned for the four languages. VitePress builds the index in Node and
// ships these two functions to the browser as source text, so each must be
// self-contained: no imports, no outside variables.

// Words, not runs of characters: Intl.Segmenter knows where Chinese words end
// (the default splitter would index a whole Chinese sentence as one token),
// and keeps a Persian word with its zero-width non-joiner together.
export function tokenize(text: string): string[] {
  const Seg = typeof Intl !== 'undefined' ? (Intl as any).Segmenter : undefined
  if (!Seg) return text.split(/[\s\p{P}\p{S}]+/u).filter(Boolean)
  const out: string[] = []
  for (const s of new Seg(undefined, { granularity: 'word' }).segment(text)) {
    if (s.isWordLike) out.push(s.segment)
  }
  return out
}

// One spelling per word: Arabic and Persian yeh/kaf, no diacritics, tatweel or
// zero-width non-joiner, Persian and Arabic digits as ASCII, ё as е.
export function processTerm(term: string): string | null {
  const t = term
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[‌‍]/g, '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/ё/g, 'е')
  return t.length > 0 ? t : null
}
