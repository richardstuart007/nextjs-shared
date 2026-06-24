'use client'

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { myMergeClasses } from './MyMergeClasses'

export const MyPagination_dftClass_Shared = 'inline-flex'

type PaginationProps = {
  totalPages: number
  statecurrentPage: number
  setStateCurrentPage: (value: number) => void
  defaultClass?: string
  overrideClass?: string
}

export default function MyPagination({
  totalPages,
  statecurrentPage,
  setStateCurrentPage,
  defaultClass = MyPagination_dftClass_Shared,
  overrideClass = ''
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
      />
      {/* --------------------------------------------------------------------- */}
      {/* Page Numbers                                                         */}
      {/* --------------------------------------------------------------------- */}
      <div className='flex -space-x-px'>
        {allPages.map((pageItem, index) => {
          const position =
            index === 0 ? 'first' : index === allPages.length - 1 ? 'last' : undefined

          // Handle '...' separately to render non-clickable placeholders
          if (pageItem === '...') {
            return (
              <div
                key={`ellipsis-${index}`}
                className='flex h-5 md:h-6 w-5 md:w-6 items-center justify-center text-xxs md:text-xs text-gray-300'
              >
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
  setStateCurrentPage
}: {
  page: number | string
  position?: 'first' | 'last' | 'single'
  isActive: boolean
  setStateCurrentPage: (value: number) => void
}) {
  const className = [
    'flex items-center justify-center border',
    'text-xxs md:text-xs',
    'h-5 md:h-6 w-5 md:w-6',
    position === 'first' || position === 'single' ? 'rounded-l-md' : '',
    position === 'last' || position === 'single' ? 'rounded-r-md' : '',
    isActive ? 'z-10 bg-blue-600 border-blue-600 text-white' : '',
    !isActive ? 'hover:bg-gray-100 cursor-pointer' : ''
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
  onClick
}: {
  direction: 'left' | 'right'
  isDisabled?: boolean
  onClick: () => void
}) {
  const className = [
    'flex items-center justify-center rounded-md border',
    isDisabled ? 'pointer-events-none text-gray-300' : '',
    !isDisabled ? 'hover:bg-gray-100 cursor-pointer' : '',
    direction === 'left' ? 'mr-2 md:mr-4' : '',
    direction === 'right' ? 'ml-2 md:ml-4' : '',
    'w-4 h-4 md:w-6 md:h-6'
  ].join(' ')

  const icon =
    direction === 'left' ? <ArrowLeftIcon className='w-4' /> : <ArrowRightIcon className='w-4' />

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
