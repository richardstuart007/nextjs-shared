'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyPaginationFooter — MySelectRows (rows-per-page, left) + MyPagination (right) combined
//    in one row, for use instead of placing the two components separately
//
//    Parameters:
//      totalPages              — total page count, passed through to MyPagination
//      statecurrentPage        — current page (1-based), passed through to MyPagination
//      setStateCurrentPage     — page-change handler, passed through to MyPagination
//      rowsPerPage             — current rows-per-page value, passed through to MySelectRows
//      setRowsPerPage          — rows-per-page change handler, passed through to MySelectRows
//      rowsOptions             — rows-per-page choices; defaults to MySelectRows_optionsDftShared
//      totalRows               — exact row count to display; when omitted, estimated as
//                                totalPages * rowsPerPage
//      overrideClass           — caller classes merged over MyPaginationFooter_dftClass
//      paginationOverrideClass — forwarded to MyPagination's overrideClass
//      selectRowsOverrideClass — forwarded to MySelectRows's overrideClass
//      totalRowsClass          — "N rows" label classes; defaults to
//                                MyPaginationFooter_totalRowsClass
//
//  2) NOTES
//    MyPaginationFooter_dftClass lays out a 3-column grid (rows-select | pagination |
//    total-rows), so MyPagination sits centered relative to the whole row rather than just
//    the leftover space after the rows-per-page dropdown. The rows-select/total-rows columns
//    are sized to their own content (grid-cols-[auto_1fr_auto]), not a fixed third each, and
//    the middle pagination column has min-w-0 + overflow-x-auto so it can never overflow onto
//    the total-rows column and intercept clicks meant for the pagination controls — see
//    3) CHANGE HISTORY.
//
//  3) CHANGE HISTORY
//    2026-09-13 — grid-cols-3 changed to grid-cols-[auto_1fr_auto], and min-w-0 + overflow-x-auto
//                 added to the pagination column's wrapper: fixes a bug where, in narrow
//                 containers with enough pages, the pagination content would overflow past its
//                 fixed 1/3-width column and the opaque total-rows label (painted later in DOM
//                 order) would intercept clicks meant for the right arrow specifically
//==============================================================================================

import MyPagination from './MyPagination'
import MySelectRows from './MySelectRows'
import { myMergeClasses } from './MyMergeClasses'
import {
  MyPaginationFooter_dftClass,
  MyPaginationFooter_totalRowsClass,
  MySelectRows_optionsDftShared,
} from '../constants'

type Props = {
  totalPages: number
  statecurrentPage: number
  setStateCurrentPage: (value: number) => void
  rowsPerPage: number
  setRowsPerPage: (value: number) => void
  rowsOptions?: readonly number[]
  totalRows?: number
  overrideClass?: string
  paginationOverrideClass?: string
  selectRowsOverrideClass?: string
  totalRowsClass?: string
}

export default function MyPaginationFooter({
  totalPages,
  statecurrentPage,
  setStateCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  rowsOptions = MySelectRows_optionsDftShared,
  totalRows,
  overrideClass = '',
  paginationOverrideClass,
  selectRowsOverrideClass,
  totalRowsClass = MyPaginationFooter_totalRowsClass,
}: Props) {
  const className = myMergeClasses(MyPaginationFooter_dftClass, overrideClass)
  const displayRows = totalRows ?? totalPages * rowsPerPage
  return (
    <div className={className}>
      <MySelectRows
        value={rowsPerPage}
        onChange={setRowsPerPage}
        options={rowsOptions}
        overrideClass={selectRowsOverrideClass}
      />
      <div className='flex justify-center min-w-0 overflow-x-auto'>
        <MyPagination
          totalPages={totalPages}
          statecurrentPage={statecurrentPage}
          setStateCurrentPage={setStateCurrentPage}
          overrideClass={paginationOverrideClass}
        />
      </div>
      <div className={totalRowsClass}>{displayRows} rows</div>
    </div>
  )
}
