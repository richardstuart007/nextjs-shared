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
  // Function to extract the core property (e.g., "md:h-" → "h-")
  //
  const getCoreClass = (cls: string) => {
    return cls.replace(/^(sm:|md:|lg:|xl:|2xl:)/, '') // Remove responsive prefix
  }

  //
  // Replace default classes with matching override classes
  //
  const updatedClassArray = defaultClassArray.map(defaultCls => {
    const matchingOverride = overrideClassArray.find(overrideCls =>
      patternsToReplace.some(
        pattern =>
          getCoreClass(defaultCls).startsWith(pattern) &&
          getCoreClass(overrideCls).startsWith(pattern)
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
            getCoreClass(overrideCls).startsWith(pattern)
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
