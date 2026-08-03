'use client'

import MyPagination from './MyPagination'
import MySelectRows from './MySelectRows'
import { myMergeClasses } from './MyMergeClasses'
import { MyPaginationFooter_dftClass, MySelectRows_optionsDftShared } from '../constants'

type Props = {
  totalPages: number
  statecurrentPage: number
  setStateCurrentPage: (value: number) => void
  rowsPerPage: number
  setRowsPerPage: (value: number) => void
  rowsOptions?: readonly number[]
  defaultClass?: string
  overrideClass?: string
  paginationOverrideClass?: string
  selectRowsOverrideClass?: string
}

//----------------------------------------------------------------------------------
//  MyPaginationFooter — MySelectRows (rows-per-page, left) + MyPagination (right) combined
//  in one row, for use instead of placing the two components separately
//----------------------------------------------------------------------------------
export default function MyPaginationFooter({
  totalPages,
  statecurrentPage,
  setStateCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  rowsOptions = MySelectRows_optionsDftShared,
  defaultClass = MyPaginationFooter_dftClass,
  overrideClass = '',
  paginationOverrideClass,
  selectRowsOverrideClass,
}: Props) {
  const className = myMergeClasses(defaultClass, overrideClass)
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
      <div />
    </div>
  )
}
