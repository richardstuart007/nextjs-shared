//
//  Central constants file for nextjs-shared. Every shared component's default Tailwind classes
//  (and any other project-wide tunable value) live here, named `ComponentName_constantName`, so
//  they're all visible in one place instead of scattered one-per-file. Not part of the package's
//  public exports map — internal to nextjs-shared only; consuming projects override component
//  appearance via each component's own `defaultClass`/`overrideClass`-style props, not by
//  importing these directly.
//

//
//  MyBackHomeNav
//
export const MyBackHomeNav_containerDftClass = 'flex gap-3'
export const MyBackHomeNav_linkDftClass = 'text-xs text-gray-500 hover:text-gray-700'

//
//  MyBox
//
export const MyBox_titleDftClass = 'text-xs font-bold mb-2'
export const MyBox_dftClass = [
  'rounded-lg',
  'border border-gray-300',
  'p-2 md:p-3',
  'mb-3',
].join(' ')

//
//  MyButton
//
export const MyButton_dftClass = [
  'flex items-center justify-center',
  'h-6 md:h-8',
  'px-1 md:px-2',
  'font-normal text-xs text-white',
  'rounded-md',
  'bg-blue-500 hover:bg-blue-600',
  'transition-colors',
  'cursor-pointer',
  'focus-visible:outline focus-visible:outline-blue-500',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ')

//
//  MyCheckbox
//
export const MyCheckbox_labelDftClass     = 'block text-gray-900 mb-1 text-xs w-72'
export const MyCheckbox_searchDftClass    = 'px-2 rounded-md border border-blue-500 py-[6px] text-xs w-72'
export const MyCheckbox_containerDftClass = 'border border-blue-500 rounded-md p-2 overflow-y-auto w-72'
export const MyCheckbox_itemDftClass      = 'flex items-center space-x-2 py-1'

//
//  MyConfirmDialog
//
export const MyConfirmDialog_iconContainerDftClass = 'bg-red-100 text-red-600 rounded-full p-4 inline-block'
export const MyConfirmDialog_titleDftClass         = 'text-lg font-semibold mt-2'
export const MyConfirmDialog_subTitleDftClass      = 'text-sm text-red-600'
export const MyConfirmDialog_lineDftClass          = 'text-sm text-green-600'
export const MyConfirmDialog_noButtonDftClass      = 'bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none'
export const MyConfirmDialog_yesButtonDftClass     = 'bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none'

//
//  MyDropdown
//
export const MyDropdown_dftClass = [
  'h-6 md:h-8',
  'py-[2px] px-1 md:px-2',
  'text-xs',
  'rounded-md',
  'border border-blue-500',
  'focus:border-1 focus:border-blue-500',
  'hover:border-blue-500',
  'transition-colors',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  'w-72',
].join(' ')
export const MyDropdown_labelDftClass = 'block text-gray-900 mb-1 text-xs w-72'
export const MyDropdown_searchDftClass = 'px-2 rounded-md border border-blue-500 py-[6px] text-xs w-72'

//
//  MyHelp
//
export const MyHelp_buttonDftClass = 'text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1.5 py-0.5 leading-none'
export const MyHelp_panelDftClass  = 'absolute z-10 mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs space-y-2 max-w-md shadow-md'
export const MyHelp_closeButtonDftClass = 'ml-4 text-gray-400 hover:text-gray-700 text-base leading-none font-bold'

//
//  MyHelpField
//
export const MyHelpField_triggerDftClass = 'rounded-full w-4 h-4 text-xs font-bold border border-gray-300 text-gray-400 hover:text-blue-600 hover:border-blue-400 flex items-center justify-center flex-shrink-0 cursor-default select-none'
export const MyHelpField_tooltipDftClass = 'absolute left-0 top-full mt-1 z-50 w-64 bg-blue-50 border border-blue-200 text-gray-700 text-xs rounded px-2 py-1.5 shadow-md pointer-events-none whitespace-normal'

//
//  MyHelpStep
//
export const MyHelpStep_buttonDftClass = 'text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1.5 py-0.5 leading-none'
export const MyHelpStep_panelDftClass  = 'absolute z-20 mt-1 p-4 bg-blue-50 border border-blue-200 rounded-md shadow-xl text-xs max-w-xl'
export const MyHelpStep_closeButtonDftClass = 'ml-4 text-gray-400 hover:text-gray-700 text-base leading-none font-bold'

//
//  MyHourGlass
//
export const MyHourGlass_dftClass = [
  'text-2xl md:text-4xl',
  'animate-flip',
].join(' ')

//
//  MyInput
//
export const MyInput_dftClass = [
  'h-6 md:h-8',
  'px-1 md:px-2',
  'font-normal text-xs',
  'rounded-md',
  'border border-blue-500',
  'focus:border-1 focus:border-blue-500',
  'hover:border-1 hover:border-blue-500',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ')

//
//  MyLink
//
export const MyLink_dftClass = [
  'flex items-center justify-center',
  'h-6 md:h-8',
  'px-1 md:px-2',
  'font-normal text-xs text-white',
  'rounded-md',
  'bg-blue-500 hover:bg-blue-600',
  'transition-colors',
  'focus-visible:outline focus-visible:outline-blue-500',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ')

//
//  MyLoadingMessage
//
export const MyLoadingMessage_containerDftClass = 'py-4 md:py-8 text-center'
export const MyLoadingMessage_messageDftClass   = 'text-xl font-bold text-red-600'

//
//  MyPagination
//
export const MyPagination_dftClass = 'inline-flex'
export const MyPagination_numbersContainerClass = 'flex -space-x-px'
export const MyPagination_ellipsisClass = 'flex h-5 md:h-6 w-5 md:w-6 items-center justify-center text-xxs md:text-xs text-gray-300'
export const MyPagination_numberClass = 'flex items-center justify-center border text-xxs md:text-xs h-5 md:h-6 w-5 md:w-6'
export const MyPagination_numberActiveClass = 'z-10 bg-blue-600 border-blue-600 text-white'
export const MyPagination_numberInactiveClass = 'hover:bg-gray-100 cursor-pointer'
export const MyPagination_arrowClass = 'flex items-center justify-center rounded-md border w-4 h-4 md:w-6 md:h-6'
export const MyPagination_arrowDisabledClass = 'pointer-events-none text-gray-300'
export const MyPagination_arrowEnabledClass = 'hover:bg-gray-100 cursor-pointer'
export const MyPagination_arrowIconClass = 'w-4'

//
//  MyPaginationFooter
//
export const MyPaginationFooter_dftClass = 'grid grid-cols-3 items-center bg-yellow-100 px-2 py-1 rounded-md'

//
//  MyPopup
//
export const MyPopup_dftClass = [
  'relative',
  'w-full max-w-md max-h-[90vh]',
  'p-4 md:p-6',
  'rounded-lg',
  'bg-white',
  'shadow-lg',
  'overflow-y-auto',
].join(' ')
export const MyPopup_overlayDftClass     = 'fixed inset-0 flex justify-center items-center z-50'
export const MyPopup_closeButtonDftClass = 'absolute top-3 right-3 text-2xl font-bold text-gray-500 hover:text-gray-800'

//
//  MySelect
//
export const MySelect_dftClass = [
  'h-6 md:h-8 w-72',
  'py-1 px-1 md:px-2',
  'text-xs',
  'rounded-md',
  'border border-blue-500',
  'focus:border-1 focus:border-blue-500',
  'hover:border-blue-500',
  'transition-colors',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ')
export const MySelect_labelDftClass     = 'font-bold text-xs whitespace-nowrap'
export const MySelect_containerDftClass = 'flex items-center gap-2'

//
//  MySelectMulti
//
export const MySelectMulti_dftClass = [
  'h-6 md:h-8 w-72',
  'py-1 px-1 md:px-2',
  'text-xs text-left',
  'rounded-md',
  'border border-blue-500',
  'hover:border-blue-600',
  'bg-white',
  'transition-colors',
].join(' ')
export const MySelectMulti_labelDftClass     = 'font-bold text-xs whitespace-nowrap'
export const MySelectMulti_containerDftClass = 'flex items-center gap-2'
export const MySelectMulti_panelDftClass     = 'absolute z-10 mt-1 top-full left-0 min-w-max bg-white border border-gray-200 rounded shadow-md p-1'

//
//  MySelectRows
//
export const MySelectRows_optionsDftShared = [10, 20, 50, 100] as const
export const MySelectRows_valueDftShared = 20
export const MySelectRows_dftClass = MySelect_dftClass.replace('w-72', 'w-24')
export const MySelectRows_staticTextClass = 'text-xs text-gray-700'

//
//  MyTab — one default class per variant/active combination
//
export const MyTab_underlineActiveClass   = 'px-3 py-1.5 text-sm font-medium border-b-2 -mb-px border-blue-600 text-blue-700'
export const MyTab_underlineInactiveClass = 'px-3 py-1.5 text-sm font-medium border-b-2 -mb-px border-transparent text-gray-500 hover:text-gray-700'
export const MyTab_pillActiveClass        = 'px-3 py-1 text-xs rounded border bg-blue-600 text-white border-blue-600'
export const MyTab_pillInactiveClass      = 'px-3 py-1 text-xs rounded border bg-white text-gray-600 border-gray-300 hover:bg-gray-50'

//
//  MyTextarea
//
export const MyTextarea_dftClass = [
  'h-24',
  'px-1 md:px-2',
  'font-normal text-xs',
  'rounded-md',
  'border border-blue-500',
  'focus:border-1 focus:border-blue-500',
  'hover:border-1 hover:border-blue-500',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  'resize-y',
].join(' ')

//
//  MyToggle
//
export const MyToggle_dftClass = [
  'relative',
  'w-11 h-6',
  'rounded-full',
  'bg-gray-400 dark:bg-gray-700',
  'peer peer-checked:after:translate-x-[1.25rem] peer-checked:after:border-white',
  'after:content-[""] after:absolute after:top-0.5 after:left-[2px]',
  'after:bg-white after:border-gray-300 after:border after:rounded-full',
  'after:h-5 after:w-5',
  'after:transition-transform dark:border-gray-600 peer-checked:bg-blue-600',
].join(' ')
export const MyToggle_labelDftClass = 'inline-flex items-center cursor-pointer'

//
//  OwnerTableCache — badge showing the first N table names before "+N more"
//
export const OwnerTableCache_tablesBadgeVisibleCount = 3

//
//  OwnerTableLogging
//
export const OwnerTableLogging_filterDebounceMs = 2000
export const OwnerTableLogging_msgTruncateLen = 200
export const OwnerTableLogging_rowsOptions = [10, 20, 40, 100] as const
