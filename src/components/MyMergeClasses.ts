import clsx from 'clsx'

/**
 * Merges default classes with override classes, and removes duplicates.
 * @param {string} defaultClass - The default classes as a string.
 * @param {string} overrideClass - The override classes as a string.
 * @returns {string} - The merged class string with duplicates removed.
 */
export function myMergeClasses(
  defaultClass: string,
  overrideClass: string
): string {
  //
  //  Classes to replace (including text size, color, and background)
  //
  const patternsToReplace = ['h-', 'w-', 'px-', 'py-', 'text-', 'bg-']

  //
  //  Split into arrays
  //
  const overrideClassArray = overrideClass.split(' ')
  const defaultClassArray = defaultClass.split(' ')

  //
  // Extract the variant prefix (e.g., "hover:" from "hover:bg-blue-600", "" from "bg-blue-600")
  //
  const getVariantPrefix = (cls: string): string => {
    const match = cls.match(/^([a-z][a-z0-9-]*:)+/)
    return match ? match[0] : ''
  }

  //
  // Extract the core property, stripping all variant/responsive prefixes
  // e.g., "hover:bg-blue-600" → "bg-blue-600", "md:h-8" → "h-8"
  //
  const getCoreClass = (cls: string) => {
    return cls.replace(/^([a-z][a-z0-9-]*:)+/, '')
  }

  //
  // Check if the class is a text SIZE class (text-xs, text-sm, etc.) — not a colour class.
  //
  const TEXT_SIZES = new Set(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl', 'xxs', 'xxx'])
  const isSizeClass = (cls: string) => {
    const core = getCoreClass(cls)
    if (!core.startsWith('text-')) return false
    const suffix = core.slice('text-'.length)
    return TEXT_SIZES.has(suffix)
  }

  // Allow replacement only when both are sizes OR both are colours — prevents text-xxs clobbering text-white.
  const canReplace = (defaultCls: string, overrideCls: string) =>
    isSizeClass(defaultCls) === isSizeClass(overrideCls)

  //
  // Replace default classes with matching override classes
  //
  const updatedClassArray = defaultClassArray.map(defaultCls => {
    const matchingOverride = overrideClassArray.find(overrideCls =>
      patternsToReplace.some(
        pattern =>
          getCoreClass(defaultCls).startsWith(pattern) &&
          getCoreClass(overrideCls).startsWith(pattern) &&
          getVariantPrefix(defaultCls) === getVariantPrefix(overrideCls) &&
          canReplace(getCoreClass(defaultCls), getCoreClass(overrideCls))
      )
    )
    return matchingOverride || defaultCls
  })

  //
  // Add override classes not present in default classes
  //
  const additionalOverrides = overrideClassArray.filter(
    overrideCls =>
      !defaultClassArray.some(defaultCls =>
        patternsToReplace.some(
          pattern =>
            getCoreClass(defaultCls).startsWith(pattern) &&
            getCoreClass(overrideCls).startsWith(pattern) &&
            getVariantPrefix(defaultCls) === getVariantPrefix(overrideCls) &&
            canReplace(getCoreClass(defaultCls), getCoreClass(overrideCls))
        )
      )
  )

  //
  //  Merge the classes and remove duplicates
  //
  const mergedClasses = [...updatedClassArray, ...additionalOverrides].filter(
    (value, index, self) => self.indexOf(value) === index
  ) // Remove duplicates

  return clsx(mergedClasses) // Merge the final classes into a string
}
