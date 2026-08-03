'use client'

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { myMergeClasses } from './MyMergeClasses'
import {
  MyPagination_dftClass,
  MyPagination_numbersContainerClass,
  MyPagination_ellipsisClass,
  MyPagination_numberClass,
  MyPagination_numberActiveClass,
  MyPagination_numberInactiveClass,
  MyPagination_arrowClass,
  MyPagination_arrowDisabledClass,
  MyPagination_arrowEnabledClass,
  MyPagination_arrowIconClass
} from '../constants'

type PaginationProps = {
  totalPages: number
  statecurrentPage: number
  setStateCurrentPage: (value: number) => void
  defaultClass?: string
  overrideClass?: string
  numbersContainerClass?: string
  ellipsisClass?: string
  numberClass?: string
  numberActiveClass?: string
  numberInactiveClass?: string
  arrowClass?: string
  arrowDisabledClass?: string
  arrowEnabledClass?: string
  arrowIconClass?: string
}

export default function MyPagination({
  totalPages,
  statecurrentPage,
  setStateCurrentPage,
  defaultClass = MyPagination_dftClass,
  overrideClass = '',
  numbersContainerClass = MyPagination_numbersContainerClass,
  ellipsisClass = MyPagination_ellipsisClass,
  numberClass = MyPagination_numberClass,
  numberActiveClass = MyPagination_numberActiveClass,
  numberInactiveClass = MyPagination_numberInactiveClass,
  arrowClass = MyPagination_arrowClass,
  arrowDisabledClass = MyPagination_arrowDisabledClass,
  arrowEnabledClass = MyPagination_arrowEnabledClass,
  arrowIconClass = MyPagination_arrowIconClass
}: PaginationProps) {
  const allPages = generatePagination(statecurrentPage, totalPages)
  const className = myMergeClasses(defaultClass, overrideClass)

  //--------------------------------------------------------------------------------------------
  // Render MyPagination
  //--------------------------------------------------------------------------------------------
  return (
    <div className={className}>
      {/* --------------------------------------------------------------------- */}
      {/* Left Arrow                                                           */}
      {/* --------------------------------------------------------------------- */}
      <PaginationArrow
        direction='left'
        isDisabled={statecurrentPage <= 1}
        onClick={() => setStateCurrentPage(statecurrentPage - 1)}
        arrowClass={arrowClass}
        arrowDisabledClass={arrowDisabledClass}
        arrowEnabledClass={arrowEnabledClass}
        arrowIconClass={arrowIconClass}
      />
      {/* --------------------------------------------------------------------- */}
      {/* Page Numbers                                                         */}
      {/* --------------------------------------------------------------------- */}
      <div className={numbersContainerClass}>
        {allPages.map((pageItem, index) => {
          const position =
            index === 0 ? 'first' : index === allPages.length - 1 ? 'last' : undefined

          // Handle '...' separately to render non-clickable placeholders
          if (pageItem === '...') {
            return (
              <div key={`ellipsis-${index}`} className={ellipsisClass}>
                ...
              </div>
            )
          }

          return (
            <PaginationNumber
              key={pageItem}
              page={pageItem}
              position={position}
              isActive={statecurrentPage === pageItem}
              setStateCurrentPage={setStateCurrentPage}
              numberClass={numberClass}
              numberActiveClass={numberActiveClass}
              numberInactiveClass={numberInactiveClass}
            />
          )
        })}
      </div>
      {/* --------------------------------------------------------------------- */}
      {/* Right Arrow                                                          */}
      {/* --------------------------------------------------------------------- */}
      <PaginationArrow
        direction='right'
        isDisabled={statecurrentPage >= totalPages}
        onClick={() => setStateCurrentPage(statecurrentPage + 1)}
        arrowClass={arrowClass}
        arrowDisabledClass={arrowDisabledClass}
        arrowEnabledClass={arrowEnabledClass}
        arrowIconClass={arrowIconClass}
      />
    </div>
  )
}

//----------------------------------------------------------------------------------
//  PaginationNumber — single clickable (or active) page number cell
//----------------------------------------------------------------------------------
function PaginationNumber({
  page,
  isActive,
  position,
  setStateCurrentPage,
  numberClass,
  numberActiveClass,
  numberInactiveClass
}: {
  page: number | string
  position?: 'first' | 'last' | 'single'
  isActive: boolean
  setStateCurrentPage: (value: number) => void
  numberClass: string
  numberActiveClass: string
  numberInactiveClass: string
}) {
  const className = [
    numberClass,
    position === 'first' || position === 'single' ? 'rounded-l-md' : '',
    position === 'last' || position === 'single' ? 'rounded-r-md' : '',
    isActive ? numberActiveClass : '',
    !isActive ? numberInactiveClass : ''
  ].join(' ')

  const handleClick = () => {
    if (typeof page === 'number') {
      setStateCurrentPage(page)
    }
  }

  return (
    <div className={className} onClick={handleClick}>
      {page}
    </div>
  )
}

//----------------------------------------------------------------------------------
//  PaginationArrow — left or right navigation arrow
//----------------------------------------------------------------------------------
function PaginationArrow({
  direction,
  isDisabled,
  onClick,
  arrowClass,
  arrowDisabledClass,
  arrowEnabledClass,
  arrowIconClass
}: {
  direction: 'left' | 'right'
  isDisabled?: boolean
  onClick: () => void
  arrowClass: string
  arrowDisabledClass: string
  arrowEnabledClass: string
  arrowIconClass: string
}) {
  const className = [
    arrowClass,
    isDisabled ? arrowDisabledClass : '',
    !isDisabled ? arrowEnabledClass : '',
    direction === 'left' ? 'mr-2 md:mr-4' : '',
    direction === 'right' ? 'ml-2 md:ml-4' : ''
  ].join(' ')

  const icon =
    direction === 'left' ? <ArrowLeftIcon className={arrowIconClass} /> : <ArrowRightIcon className={arrowIconClass} />

  return (
    <div className={className} onClick={onClick}>
      {icon}
    </div>
  )
}

//----------------------------------------------------------------------------------
//  generatePagination — builds the page number / ellipsis array for display
//----------------------------------------------------------------------------------
function generatePagination(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages]
  if (currentPage >= totalPages - 3)
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}
