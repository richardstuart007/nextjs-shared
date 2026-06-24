import clsx from 'clsx'

//
//  Each group defines the Tailwind patterns it owns and an optional cross-type guard.
//  Groups are processed in order — the group order IS the output order.
//
type Group = {
  patterns: string[]
  canReplaceCheck?: (defaultCls: string, overrideCls: string) => boolean
}

const CLASS_GROUPS: Group[] = [
  // — Sizing & Spacing —
  { patterns: ['h-', 'min-h-', 'max-h-', 'w-', 'min-w-', 'max-w-'] },
  { patterns: ['p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-'] },
  { patterns: ['m-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-'] },
  { patterns: ['gap-'] },
  // — Typography —
  { patterns: ['font-'] },
  { patterns: ['text-'],  canReplaceCheck: sameTextType },
  { patterns: ['leading-'] },
  { patterns: ['tracking-'] },
  // — Visual —
  { patterns: ['rounded'] },
  { patterns: ['border'], canReplaceCheck: sameBorderType },
  { patterns: ['bg-'] },
  { patterns: ['shadow'] },
  // — Effects —
  { patterns: ['opacity-'] },
  { patterns: ['outline'] },
  { patterns: ['transition'] },
  { patterns: ['cursor-'] },
]

//----------------------------------------------------------------------------------
//  myMergeClasses — merges default Tailwind classes with caller overrides
//
//  Output order: unmatched layout/structural classes (flex, grid, relative…) →
//  Sizing & Spacing → Typography → Visual → Effects → unmatched new overrides
//
//  Responsive variants (md:, sm:) stay adjacent to their base class within each
//  group — not sorted to the end.
//----------------------------------------------------------------------------------
export function myMergeClasses(defaultClass: string, overrideClass: string): string {
  const defaultArr  = defaultClass.split(' ').filter(Boolean)
  const overrideArr = overrideClass.split(' ').filter(Boolean)

  const allPatterns = CLASS_GROUPS.flatMap(g => g.patterns)

  //
  //  A class belongs to a group if its core (variant-stripped) starts with any pattern
  //
  function inAnyGroup(cls: string): boolean {
    const core = getCoreClass(cls)
    return allPatterns.some(p => core.startsWith(p))
  }

  //
  //  Unmatched layout/structural classes (flex, grid, relative, z-*, overflow-*, …)
  //  go to the front; unmatched new overrides go to the end
  //
  const unmatchedDefault  = defaultArr.filter(c => !inAnyGroup(c))
  const unmatchedOverride = overrideArr.filter(c => !inAnyGroup(c))

  //
  //  Process each group independently; group order determines output order
  //
  const groupedOutput = CLASS_GROUPS.flatMap(group => {
    const dGroup = defaultArr.filter(c => group.patterns.some(p => getCoreClass(c).startsWith(p)))
    const oGroup = overrideArr.filter(c => group.patterns.some(p => getCoreClass(c).startsWith(p)))
    return mergeGroup(dGroup, oGroup, group)
  })

  const merged = [...unmatchedDefault, ...groupedOutput, ...unmatchedOverride]
  const deduped = merged.filter((v, i, a) => a.indexOf(v) === i)
  const result = clsx(deduped)
  return result
}

//----------------------------------------------------------------------------------
//  mergeGroup — merges one group: replaces defaults with overrides where matched;
//               new overrides (no replacement target) are appended at end of group
//----------------------------------------------------------------------------------
function mergeGroup(defaultClasses: string[], overrideClasses: string[], group: Group): string[] {
  const { patterns, canReplaceCheck } = group
  const usedOverrides = new Set<string>()

  const result = defaultClasses.map(dCls => {
    const match = overrideClasses.find(oCls =>
      !usedOverrides.has(oCls) &&
      patterns.some(p => getCoreClass(dCls).startsWith(p) && getCoreClass(oCls).startsWith(p)) &&
      getVariantPrefix(dCls) === getVariantPrefix(oCls) &&
      (canReplaceCheck ? canReplaceCheck(getCoreClass(dCls), getCoreClass(oCls)) : true)
    )
    if (match) usedOverrides.add(match)
    return match ?? dCls
  })

  const extra = overrideClasses.filter(oCls => !usedOverrides.has(oCls))
  return [...result, ...extra]
}

//----------------------------------------------------------------------------------
//  getVariantPrefix — extracts variant prefix e.g. "hover:" from "hover:bg-blue-600"
//----------------------------------------------------------------------------------
function getVariantPrefix(cls: string): string {
  const match = cls.match(/^([a-z][a-z0-9-]*:)+/)
  return match ? match[0] : ''
}

//----------------------------------------------------------------------------------
//  getCoreClass — strips variant/responsive prefixes e.g. "md:h-8" → "h-8"
//----------------------------------------------------------------------------------
function getCoreClass(cls: string): string {
  const result = cls.replace(/^([a-z][a-z0-9-]*:)+/, '')
  return result
}

//----------------------------------------------------------------------------------
//  isTextSizeClass — true if cls is a text SIZE class (text-xs etc.), not a colour
//----------------------------------------------------------------------------------
const TEXT_SIZES = new Set(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl', 'xxs', 'xxx'])

function isTextSizeClass(cls: string): boolean {
  const core = getCoreClass(cls)
  if (!core.startsWith('text-')) return false
  const suffix = core.slice('text-'.length)
  const result = TEXT_SIZES.has(suffix)
  return result
}

//----------------------------------------------------------------------------------
//  isBorderColorClass — true if cls is a border COLOUR class (e.g. border-pink-600)
//  Border colour has a dash in its suffix; border width (border-4) and bare (border) do not
//----------------------------------------------------------------------------------
function isBorderColorClass(cls: string): boolean {
  if (!cls.startsWith('border-')) return false
  const suffix = cls.slice('border-'.length)
  const result = suffix.includes('-')
  return result
}

//----------------------------------------------------------------------------------
//  sameTextType — guard for text- group: size class must replace size, colour replace colour
//----------------------------------------------------------------------------------
function sameTextType(defaultCls: string, overrideCls: string): boolean {
  const result = isTextSizeClass(defaultCls) === isTextSizeClass(overrideCls)
  return result
}

//----------------------------------------------------------------------------------
//  sameBorderType — guard for border group: width must replace width, colour replace colour
//----------------------------------------------------------------------------------
function sameBorderType(defaultCls: string, overrideCls: string): boolean {
  const result = isBorderColorClass(defaultCls) === isBorderColorClass(overrideCls)
  return result
}
