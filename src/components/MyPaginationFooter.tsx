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
//      defaultClass            — row wrapper base classes; defaults to
//                                MyPaginationFooter_dftClass
//      overrideClass           — caller classes merged over defaultClass
//      paginationOverrideClass — forwarded to MyPagination's overrideClass
//      selectRowsOverrideClass — forwarded to MySelectRows's overrideClass
//      totalRowsClass          — "N rows" label classes; defaults to
//                                MyPaginationFooter_totalRowsClass
//
//  2) NOTES
//    defaultClass lays out a 3-column grid (rows-select | pagination | total-rows), so
//    MyPagination sits centered relative to the whole row rather than just the leftover
//    space after the rows-per-page dropdown.
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
  defaultClass?: string
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
  defaultClass = MyPaginationFooter_dftClass,
  overrideClass = '',
  paginationOverrideClass,
  selectRowsOverrideClass,
  totalRowsClass = MyPaginationFooter_totalRowsClass,
}: Props) {
  const className = myMergeClasses(defaultClass, overrideClass)
  const displayRows = totalRows ?? totalPages * rowsPerPage
  return (
    <div className={className}>
      <MySelectRows
        value={rowsPerPage}
        onChange={setRowsPerPage}
        options={rowsOptions}
        overrideClass={selectRowsOverrideClass}
      />
      <div className='flex justify-center'>
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
