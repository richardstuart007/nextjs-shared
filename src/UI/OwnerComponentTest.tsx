'use client'

import { useState, useEffect, useRef } from 'react'
import OwnerPage from './OwnerPage'
import { MyButton, MyButton_dftClass_Shared } from '../components/MyButton'
import { MyInputProject as MyInput } from './components_wrappers/MyInput'
import { MyInput_dftClass_Project } from './components_wrappers/defaults'
import { MyTextarea, MyTextarea_dftClass_Shared } from '../components/MyTextarea'
import MyDropdown, { MyDropdown_dftClass_Shared } from '../components/MyDropdown'
import { myMergeClasses } from '../components/MyMergeClasses'
import MyCheckBox from '../components/MyCheckbox'
import { MyConfirmDialog, ConfirmDialogInt } from '../components/MyConfirmDialog'
import MyPagination from '../components/MyPagination'
import { MyLink, MyLink_dftClass_Shared } from '../components/MyLink'
import MySelect, { MySelect_dftClass_Shared } from '../components/MySelect'
import { MyToggle, MyToggle_dftClass_Shared } from '../components/MyToggle'
import { MyLoadingMessage } from '../components/MyLoadingMessage'
import MyPopup, { MyPopup_dftClass_Shared } from '../components/MyPopup'
import { MyHourGlass, MyHourGlass_dftClass_Shared } from '../components/MyHourGlass'
import { MyHelp } from '../components/MyHelp'
import { MyHelpField } from '../components/MyHelpField'
import { MyHelpStep } from '../components/MyHelpStep'
import {
  MyTab,
  MyTab_underlineActiveClass_Shared,
  MyTab_underlineInactiveClass_Shared,
  MyTab_pillActiveClass_Shared,
  MyTab_pillInactiveClass_Shared,
} from '../components/MyTab'
import { MyBoxProject } from './components_wrappers/MyBox'
import { MyBox_dftClass_Project } from './components_wrappers/defaults'

//
//  Static data for MyDropdown
//
const dropdownData = [
  { col_label: 'Red', col_value: 'red' },
  { col_label: 'Green', col_value: 'green' },
  { col_label: 'Blue', col_value: 'blue' },
  { col_label: 'Yellow', col_value: 'yellow' },
  { col_label: 'Purple', col_value: 'purple' },
]

//
//  Static options for MyCheckBox
//
const checkboxOptions = [
  { value: 'apples', label: 'Apples' },
  { value: 'bananas', label: 'Bananas' },
  { value: 'cherries', label: 'Cherries' },
  { value: 'dates', label: 'Dates' },
  { value: 'elderberries', label: 'Elderberries' },
]

//----------------------------------------------------------------------------------
//  OwnerComponentTest — one tab per component; props → display → returns
//----------------------------------------------------------------------------------
export default function OwnerComponentTest() {
  const tabs = [
    { label: 'MyButton', content: <MyButtonTab /> },
    { label: 'MyInput', content: <MyInputTab /> },
    { label: 'MyTextarea', content: <MyTextareaTab /> },
    { label: 'MyBox', content: <MyBoxTab /> },
    { label: 'MyDropdown', content: <MyDropdownTab /> },
    { label: 'MyCheckBox', content: <MyCheckBoxTab /> },
    { label: 'MyPagination', content: <MyPaginationTab /> },
    { label: 'MyConfirmDialog', content: <MyConfirmDialogTab /> },
    { label: 'MyLink', content: <MyLinkTab /> },
    { label: 'MySelect', content: <MySelectTab /> },
    { label: 'MyToggle', content: <MyToggleTab /> },
    { label: 'MyLoadingMessage', content: <MyLoadingMessageTab /> },
    { label: 'MyPopup', content: <MyPopupTab /> },
    { label: 'MyHourGlass', content: <MyHourGlassTab /> },
    { label: 'MyHelp', content: <MyHelpTab /> },
    { label: 'MyHelpField', content: <MyHelpFieldTab /> },
    { label: 'MyHelpStep', content: <MyHelpStepTab /> },
    { label: 'MyTab', content: <MyTabTab /> },
  ]
  const result = <OwnerPage tabs={tabs} />
  return result
}

//
//  ─── Layout helpers ────────────────────────────────────────────────────────────
//

type ControlRowProps = { label: string; children: React.ReactNode }

//----------------------------------------------------------------------------------
//  ControlRow — prop label aligned with its control
//----------------------------------------------------------------------------------
function ControlRow({ label, children }: ControlRowProps) {
  return (
    <div className='flex items-center gap-2 min-h-7'>
      <span className='text-xs text-gray-600 w-40 shrink-0'>{label}</span>
      {children}
    </div>
  )
}

type ReturnRowProps = { label: string; value: string }

//----------------------------------------------------------------------------------
//  ReturnRow — key/value display for returned values
//----------------------------------------------------------------------------------
function ReturnRow({ label, value }: ReturnRowProps) {
  return (
    <div className='flex gap-2 text-xs mb-1'>
      <span className='text-gray-500 w-28 shrink-0'>{label}:</span>
      <span className='font-mono text-gray-900 break-all'>{value}</span>
    </div>
  )
}

type ThreeSectionProps = {
  controls: React.ReactNode
  preview: React.ReactNode
  returns: React.ReactNode
}

//----------------------------------------------------------------------------------
//  ThreeSection — Props | Display | Returns layout
//----------------------------------------------------------------------------------
function ThreeSection({ controls, preview, returns }: ThreeSectionProps) {
  return (
    <div className='p-4 grid grid-cols-3 gap-6 items-start min-h-64'>
      <div className='border-r border-gray-200 pr-4'>
        <p className='text-xs font-semibold text-gray-500 mb-3'>Props</p>
        {controls}
      </div>
      <div className='border-r border-gray-200 pr-4'>
        <p className='text-xs font-semibold text-gray-500 mb-3'>Display</p>
        {preview}
      </div>
      <div>
        <p className='text-xs font-semibold text-gray-500 mb-3'>Returns</p>
        {returns}
      </div>
    </div>
  )
}

//----------------------------------------------------------------------------------
//  parseRestProps — parses key="value" pairs from a string into a props object
//----------------------------------------------------------------------------------
function parseRestProps(str: string): Record<string, string> {
  const result: Record<string, string> = {}
  const regex = /(\S+)="([^"]*)"/g
  let match = regex.exec(str)
  while (match !== null) {
    result[match[1]] = match[2]
    match = regex.exec(str)
  }
  return result
}

//
//  ─── Tab components ────────────────────────────────────────────────────────────
//

type BtnProps = { label: string; overrideClass: string; restProps: string }
const btnDefaults: BtnProps = { label: 'Click me', overrideClass: '', restProps: 'aria-disabled="true"' }

//----------------------------------------------------------------------------------
//  MyButtonTab
//----------------------------------------------------------------------------------
function MyButtonTab() {
  const [draft, setDraft] = useState<BtnProps>(btnDefaults)
  const [applied, setApplied] = useState<BtnProps>(btnDefaults)
  const [clickCount, setClickCount] = useState(0)
  const [lastClicked, setLastClicked] = useState('—')

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea
              value={draft.overrideClass}
              onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))}
              overrideClass='w-full h-48'
            />
          </ControlRow>
          <ControlRow label='rest props'>
            <MyTextarea
              value={draft.restProps}
              onChange={e => setDraft(d => ({ ...d, restProps: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyButton
          overrideClass={applied.overrideClass}
          {...parseRestProps(applied.restProps)}
          onClick={() => {
            setClickCount(c => c + 1)
            setLastClicked(new Date().toLocaleTimeString())
          }}
        >
          {applied.label}
        </MyButton>
      }
      returns={
        <>
          <ReturnRow label='click count' value={String(clickCount)} />
          <ReturnRow label='last clicked' value={lastClicked} />
          <ReturnRow label='className' value={myMergeClasses(MyButton_dftClass_Shared, applied.overrideClass)} />
          {Object.entries(parseRestProps(applied.restProps)).map(([k, v]) => (
            <ReturnRow key={k} label={k} value={v} />
          ))}
        </>
      }
    />
  )
}

type InputProps = { placeholder: string; type: string; overrideClass: string; disabled: boolean; restProps: string }
const inputDefaults: InputProps = { placeholder: 'Enter text', type: 'text', overrideClass: '', disabled: false, restProps: 'aria-disabled="true"' }

//----------------------------------------------------------------------------------
//  MyInputTab
//----------------------------------------------------------------------------------
function MyInputTab() {
  const [draft, setDraft] = useState<InputProps>(inputDefaults)
  const [applied, setApplied] = useState<InputProps>(inputDefaults)
  const [value, setValue] = useState('')

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='type'>
            <select
              className='text-sm border border-gray-300 rounded px-1 h-9 w-full'
              value={draft.type}
              onChange={e => setDraft(d => ({ ...d, type: e.target.value }))}
            >
              <option>text</option>
              <option>number</option>
              <option>email</option>
              <option>password</option>
            </select>
          </ControlRow>
          <ControlRow label='placeholder'>
            <MyInput value={draft.placeholder} onChange={e => setDraft(d => ({ ...d, placeholder: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea
              value={draft.overrideClass}
              onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))}
              overrideClass='w-full h-48'
            />
          </ControlRow>
          <ControlRow label='disabled'>
            <input type='checkbox' checked={draft.disabled} onChange={e => setDraft(d => ({ ...d, disabled: e.target.checked }))} />
          </ControlRow>
          <ControlRow label='rest props'>
            <MyTextarea
              value={draft.restProps}
              onChange={e => setDraft(d => ({ ...d, restProps: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyInput
          type={applied.type}
          placeholder={applied.placeholder}
          disabled={applied.disabled}
          overrideClass={applied.overrideClass}
          value={value}
          onChange={e => setValue(e.target.value)}
          {...parseRestProps(applied.restProps)}
        />
      }
      returns={
        <>
          <ReturnRow label='value' value={value || '(empty)'} />
          <ReturnRow label='length' value={String(value.length)} />
          <ReturnRow label='className' value={myMergeClasses(MyInput_dftClass_Project, applied.overrideClass)} />
          {Object.entries(parseRestProps(applied.restProps)).map(([k, v]) => (
            <ReturnRow key={k} label={k} value={v} />
          ))}
        </>
      }
    />
  )
}

type TextareaProps = { placeholder: string; overrideClass: string; disabled: boolean; restProps: string }
const textareaDefaults: TextareaProps = { placeholder: 'Enter text', overrideClass: '', disabled: false, restProps: 'aria-disabled="true"' }

//----------------------------------------------------------------------------------
//  MyTextareaTab
//----------------------------------------------------------------------------------
function MyTextareaTab() {
  const [draft, setDraft] = useState<TextareaProps>(textareaDefaults)
  const [applied, setApplied] = useState<TextareaProps>(textareaDefaults)
  const [value, setValue] = useState('')

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='placeholder'>
            <MyInput value={draft.placeholder} onChange={e => setDraft(d => ({ ...d, placeholder: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea
              value={draft.overrideClass}
              onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))}
              overrideClass='w-full h-48'
            />
          </ControlRow>
          <ControlRow label='disabled'>
            <input type='checkbox' checked={draft.disabled} onChange={e => setDraft(d => ({ ...d, disabled: e.target.checked }))} />
          </ControlRow>
          <ControlRow label='rest props'>
            <MyTextarea
              value={draft.restProps}
              onChange={e => setDraft(d => ({ ...d, restProps: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyTextarea
          placeholder={applied.placeholder}
          disabled={applied.disabled}
          overrideClass={applied.overrideClass}
          value={value}
          onChange={e => setValue(e.target.value)}
          {...parseRestProps(applied.restProps)}
        />
      }
      returns={
        <>
          <ReturnRow label='value' value={value || '(empty)'} />
          <ReturnRow label='characters' value={String(value.length)} />
          <ReturnRow label='lines' value={String(value.split('\n').length)} />
          <ReturnRow label='className' value={myMergeClasses(MyTextarea_dftClass_Shared, applied.overrideClass)} />
          {Object.entries(parseRestProps(applied.restProps)).map(([k, v]) => (
            <ReturnRow key={k} label={k} value={v} />
          ))}
        </>
      }
    />
  )
}

type BoxProps = { title: string; content: string; className: string }
const boxDefaults: BoxProps = { title: 'Box Title', content: 'Box content', className: '' }

//----------------------------------------------------------------------------------
//  MyBoxTab
//----------------------------------------------------------------------------------
function MyBoxTab() {
  const [draft, setDraft] = useState<BoxProps>(boxDefaults)
  const [applied, setApplied] = useState<BoxProps>(boxDefaults)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='title'>
            <MyInput value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='content'>
            <MyInput value={draft.content} onChange={e => setDraft(d => ({ ...d, content: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='className (override)'>
            <MyTextarea
              value={draft.className}
              onChange={e => setDraft(d => ({ ...d, className: e.target.value }))}
              overrideClass='w-full h-48'
            />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyBoxProject title={applied.title} className={applied.className}>
          <p className='text-xs'>{applied.content}</p>
        </MyBoxProject>
      }
      returns={
        <>
          <ReturnRow label='title' value={applied.title || '(none)'} />
          <ReturnRow label='defaultClass' value={MyBox_dftClass_Project} />
          <ReturnRow label='className' value={myMergeClasses(MyBox_dftClass_Project, applied.className)} />
        </>
      }
    />
  )
}

type DropdownControlProps = {
  label: string
  overrideClass_Dropdown: string
  includeBlank: boolean
  searchEnabled: boolean
}
const dropdownDefaults: DropdownControlProps = {
  label: 'Pick one',
  overrideClass_Dropdown: 'w-72',
  includeBlank: true,
  searchEnabled: false,
}

//----------------------------------------------------------------------------------
//  MyDropdownTab
//----------------------------------------------------------------------------------
function MyDropdownTab() {
  const [draft, setDraft] = useState<DropdownControlProps>(dropdownDefaults)
  const [applied, setApplied] = useState<DropdownControlProps>(dropdownDefaults)
  const [selectedOption, setSelectedOption] = useState<string | number>('')

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
    setSelectedOption('')
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='overrideClass_Dropdown'>
            <MyTextarea
              value={draft.overrideClass_Dropdown}
              onChange={e => setDraft(d => ({ ...d, overrideClass_Dropdown: e.target.value }))}
              overrideClass='w-full h-48'
            />
          </ControlRow>
          <ControlRow label='includeBlank'>
            <input type='checkbox' checked={draft.includeBlank} onChange={e => setDraft(d => ({ ...d, includeBlank: e.target.checked }))} />
          </ControlRow>
          <ControlRow label='searchEnabled'>
            <input type='checkbox' checked={draft.searchEnabled} onChange={e => setDraft(d => ({ ...d, searchEnabled: e.target.checked }))} />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyDropdown
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          tableData={dropdownData}
          optionLabel='col_label'
          optionValue='col_value'
          label={applied.label}
          name='colour'
          includeBlank={applied.includeBlank}
          searchEnabled={applied.searchEnabled}
          overrideClass_Dropdown={applied.overrideClass_Dropdown}
        />
      }
      returns={
        <>
          <ReturnRow label='selectedOption' value={selectedOption !== '' ? String(selectedOption) : '(none)'} />
          <ReturnRow label='type' value={selectedOption !== '' ? typeof selectedOption : '—'} />
          <ReturnRow label='className' value={myMergeClasses(MyDropdown_dftClass_Shared, applied.overrideClass_Dropdown)} />
        </>
      }
    />
  )
}

type CheckBoxControlProps = {
  label: string
  searchEnabled: boolean
  showSelectedCount: boolean
  showResortButton: boolean
  maxSelections: string
  minSelections: string
}
const checkboxDefaults: CheckBoxControlProps = {
  label: 'Select items',
  searchEnabled: true,
  showSelectedCount: true,
  showResortButton: true,
  maxSelections: '',
  minSelections: '',
}

//----------------------------------------------------------------------------------
//  MyCheckBoxTab
//----------------------------------------------------------------------------------
function MyCheckBoxTab() {
  const [draft, setDraft] = useState<CheckBoxControlProps>(checkboxDefaults)
  const [applied, setApplied] = useState<CheckBoxControlProps>(checkboxDefaults)
  const [selected, setSelected] = useState<Array<string | number>>([])

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
    setSelected([])
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='maxSelections'>
            <MyInput
              type='number'
              value={draft.maxSelections}
              onChange={e => setDraft(d => ({ ...d, maxSelections: e.target.value }))}
              overrideClass='w-20'
            />
          </ControlRow>
          <ControlRow label='minSelections'>
            <MyInput
              type='number'
              value={draft.minSelections}
              onChange={e => setDraft(d => ({ ...d, minSelections: e.target.value }))}
              overrideClass='w-20'
            />
          </ControlRow>
          <ControlRow label='searchEnabled'>
            <input type='checkbox' checked={draft.searchEnabled} onChange={e => setDraft(d => ({ ...d, searchEnabled: e.target.checked }))} />
          </ControlRow>
          <ControlRow label='showSelectedCount'>
            <input type='checkbox' checked={draft.showSelectedCount} onChange={e => setDraft(d => ({ ...d, showSelectedCount: e.target.checked }))} />
          </ControlRow>
          <ControlRow label='showResortButton'>
            <input type='checkbox' checked={draft.showResortButton} onChange={e => setDraft(d => ({ ...d, showResortButton: e.target.checked }))} />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyCheckBox
          options={checkboxOptions}
          selectedOptions={selected}
          setSelectedOptions={setSelected}
          name='fruits'
          label={applied.label}
          searchEnabled={applied.searchEnabled}
          showSelectedCount={applied.showSelectedCount}
          showResortButton={applied.showResortButton}
          maxSelections={applied.maxSelections !== '' ? Number(applied.maxSelections) : undefined}
          minSelections={applied.minSelections !== '' ? Number(applied.minSelections) : undefined}
        />
      }
      returns={
        <>
          <ReturnRow label='count' value={String(selected.length)} />
          <ReturnRow label='selected' value={selected.length > 0 ? selected.join(', ') : '(none)'} />
        </>
      }
    />
  )
}

type PaginationControlProps = { totalPages: string }
const paginationDefaults: PaginationControlProps = { totalPages: '10' }

//----------------------------------------------------------------------------------
//  MyPaginationTab
//----------------------------------------------------------------------------------
function MyPaginationTab() {
  const [draft, setDraft] = useState<PaginationControlProps>(paginationDefaults)
  const [applied, setApplied] = useState<PaginationControlProps>(paginationDefaults)
  const [currentPage, setCurrentPage] = useState(1)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
    setCurrentPage(1)
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='totalPages'>
            <MyInput
              type='number'
              value={draft.totalPages}
              onChange={e => setDraft(d => ({ ...d, totalPages: e.target.value }))}
              overrideClass='w-20'
            />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyPagination
          totalPages={applied.totalPages !== '' ? Number(applied.totalPages) : 1}
          statecurrentPage={currentPage}
          setStateCurrentPage={setCurrentPage}
        />
      }
      returns={
        <>
          <ReturnRow label='currentPage' value={String(currentPage)} />
          <ReturnRow label='totalPages' value={applied.totalPages || '1'} />
        </>
      }
    />
  )
}

type DialogControlProps = {
  title: string
  subTitle: string
  line1: string
  line2: string
  iconContainerClass: string
  titleClass: string
  subTitleClass: string
  lineClass: string
  noButtonClass: string
  yesButtonClass: string
}
const dialogDefaults: DialogControlProps = {
  title: 'Confirm Action',
  subTitle: 'This cannot be undone',
  line1: '',
  line2: '',
  iconContainerClass: 'bg-red-100 text-red-600 rounded-full p-4 inline-block',
  titleClass: 'text-lg font-semibold mt-2',
  subTitleClass: 'text-sm text-red-600',
  lineClass: 'text-sm text-green-600',
  noButtonClass: 'bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none',
  yesButtonClass: 'bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none',
}

//----------------------------------------------------------------------------------
//  MyConfirmDialogTab
//----------------------------------------------------------------------------------
function MyConfirmDialogTab() {
  const [draft, setDraft] = useState<DialogControlProps>(dialogDefaults)
  const [applied, setApplied] = useState<DialogControlProps>(dialogDefaults)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogInt>({ ...dialogDefaults, isOpen: false, onConfirm: () => {} })
  const [lastAction, setLastAction] = useState('—')
  const prevOpenRef = useRef(false)

  //
  //  Detect cancel: dialog closed without onConfirm firing
  //
  useEffect(() => {
    if (prevOpenRef.current && !confirmDialog.isOpen) {
      setLastAction(prev => {
        const result = prev === 'opened' ? 'cancelled at ' + new Date().toLocaleTimeString() : prev
        return result
      })
    }
    prevOpenRef.current = confirmDialog.isOpen
  }, [confirmDialog.isOpen])

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  function openDialog() {
    setLastAction('opened')
    setConfirmDialog({
      isOpen: true,
      title: applied.title,
      subTitle: applied.subTitle,
      line1: applied.line1 || undefined,
      line2: applied.line2 || undefined,
      onConfirm: () => {
        setLastAction('confirmed at ' + new Date().toLocaleTimeString())
        setConfirmDialog(d => ({ ...d, isOpen: false }))
      },
    })
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='title'>
            <MyInput value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='subTitle'>
            <MyInput value={draft.subTitle} onChange={e => setDraft(d => ({ ...d, subTitle: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='line1'>
            <MyInput value={draft.line1} onChange={e => setDraft(d => ({ ...d, line1: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='line2'>
            <MyInput value={draft.line2} onChange={e => setDraft(d => ({ ...d, line2: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='iconContainerClass'>
            <MyTextarea value={draft.iconContainerClass} onChange={e => setDraft(d => ({ ...d, iconContainerClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='titleClass'>
            <MyInput value={draft.titleClass} onChange={e => setDraft(d => ({ ...d, titleClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='subTitleClass'>
            <MyInput value={draft.subTitleClass} onChange={e => setDraft(d => ({ ...d, subTitleClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='lineClass'>
            <MyInput value={draft.lineClass} onChange={e => setDraft(d => ({ ...d, lineClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='noButtonClass'>
            <MyTextarea value={draft.noButtonClass} onChange={e => setDraft(d => ({ ...d, noButtonClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='yesButtonClass'>
            <MyTextarea value={draft.yesButtonClass} onChange={e => setDraft(d => ({ ...d, yesButtonClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <div className='flex flex-col gap-2'>
          <MyButton onClick={openDialog}>Open Dialog</MyButton>
          <MyConfirmDialog
            confirmDialog={confirmDialog}
            setConfirmDialog={setConfirmDialog}
            iconContainerClass={applied.iconContainerClass}
            titleClass={applied.titleClass}
            subTitleClass={applied.subTitleClass}
            lineClass={applied.lineClass}
            noButtonClass={applied.noButtonClass}
            yesButtonClass={applied.yesButtonClass}
          />
        </div>
      }
      returns={
        <>
          <ReturnRow label='isOpen' value={String(confirmDialog.isOpen)} />
          <ReturnRow label='last action' value={lastAction} />
        </>
      }
    />
  )
}

type LinkControlProps = { label: string; pathname: string; overrideClass: string; restProps: string }
const linkDefaults: LinkControlProps = { label: 'Go to page', pathname: '/owner', overrideClass: '', restProps: 'aria-disabled="true"' }

//----------------------------------------------------------------------------------
//  MyLinkTab
//----------------------------------------------------------------------------------
function MyLinkTab() {
  const [draft, setDraft] = useState<LinkControlProps>(linkDefaults)
  const [applied, setApplied] = useState<LinkControlProps>(linkDefaults)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  const computedClass = myMergeClasses(MyLink_dftClass_Shared, applied.overrideClass)

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='label (children)'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='pathname'>
            <MyInput value={draft.pathname} onChange={e => setDraft(d => ({ ...d, pathname: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea value={draft.overrideClass} onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))} overrideClass='w-full h-48' />
          </ControlRow>
          <ControlRow label='rest props'>
            <MyTextarea
              value={draft.restProps}
              onChange={e => setDraft(d => ({ ...d, restProps: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyLink href={{ reference: 'test', pathname: applied.pathname || '#' }} overrideClass={applied.overrideClass} {...parseRestProps(applied.restProps)}>
          {applied.label || ' '}
        </MyLink>
      }
      returns={
        <>
          <ReturnRow label='className' value={computedClass} />
          {Object.entries(parseRestProps(applied.restProps)).map(([k, v]) => (
            <ReturnRow key={k} label={k} value={v} />
          ))}
        </>
      }
    />
  )
}

type SelectControlProps = { label: string; options: string; overrideClass: string; labelClass: string; containerClass: string }
const selectDefaults: SelectControlProps = {
  label: 'Pick one',
  options: 'Apple,Banana,Cherry',
  overrideClass: '',
  labelClass: 'font-bold text-xs whitespace-nowrap',
  containerClass: 'flex items-center gap-2',
}

//----------------------------------------------------------------------------------
//  MySelectTab
//----------------------------------------------------------------------------------
function MySelectTab() {
  const [draft, setDraft] = useState<SelectControlProps>(selectDefaults)
  const [applied, setApplied] = useState<SelectControlProps>(selectDefaults)
  const [selected, setSelected] = useState('')

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
    setSelected('')
  }

  const parsedOptions = applied.options.split(',').map(o => o.trim()).filter(Boolean)
  const computedClass = myMergeClasses(MySelect_dftClass_Shared, applied.overrideClass)

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='options (comma-sep)'>
            <MyInput value={draft.options} onChange={e => setDraft(d => ({ ...d, options: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea value={draft.overrideClass} onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))} overrideClass='w-full h-48' />
          </ControlRow>
          <ControlRow label='labelClass'>
            <MyInput value={draft.labelClass} onChange={e => setDraft(d => ({ ...d, labelClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='containerClass'>
            <MyInput value={draft.containerClass} onChange={e => setDraft(d => ({ ...d, containerClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MySelect
          label={applied.label}
          options={parsedOptions}
          overrideClass={applied.overrideClass}
          labelClass={applied.labelClass}
          containerClass={applied.containerClass}
          value={selected}
          onChange={e => setSelected(e.target.value)}
        />
      }
      returns={
        <>
          <ReturnRow label='selected' value={selected || '(none)'} />
          <ReturnRow label='className' value={computedClass} />
        </>
      }
    />
  )
}

type LoadingMessageControlProps = { message1: string; message2: string; containerClass: string; messageClass: string }
const loadingMessageDefaults: LoadingMessageControlProps = {
  message1: 'Please wait...',
  message2: '',
  containerClass: 'py-8 text-center',
  messageClass: 'text-xl font-bold text-red-600',
}

//----------------------------------------------------------------------------------
//  MyLoadingMessageTab
//----------------------------------------------------------------------------------
function MyLoadingMessageTab() {
  const [draft, setDraft] = useState<LoadingMessageControlProps>(loadingMessageDefaults)
  const [applied, setApplied] = useState<LoadingMessageControlProps>(loadingMessageDefaults)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='message1'>
            <MyInput value={draft.message1} onChange={e => setDraft(d => ({ ...d, message1: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='message2'>
            <MyInput value={draft.message2} onChange={e => setDraft(d => ({ ...d, message2: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='containerClass'>
            <MyInput value={draft.containerClass} onChange={e => setDraft(d => ({ ...d, containerClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='messageClass'>
            <MyTextarea value={draft.messageClass} onChange={e => setDraft(d => ({ ...d, messageClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyLoadingMessage
          message1={applied.message1}
          message2={applied.message2}
          containerClass={applied.containerClass}
          messageClass={applied.messageClass}
        />
      }
      returns={
        <>
          <ReturnRow label='message1' value={applied.message1} />
          <ReturnRow label='message2' value={applied.message2 || '(empty)'} />
          <ReturnRow label='containerClass' value={applied.containerClass} />
          <ReturnRow label='messageClass' value={applied.messageClass} />
        </>
      }
    />
  )
}

type ToggleControlProps = { inputName: string; inputValue: boolean; overrideClass: string; labelClass: string }
const toggleDefaults: ToggleControlProps = {
  inputName: 'my-toggle',
  inputValue: false,
  overrideClass: '',
  labelClass: 'inline-flex items-center cursor-pointer',
}

//----------------------------------------------------------------------------------
//  MyToggleTab
//----------------------------------------------------------------------------------
function MyToggleTab() {
  const [draft, setDraft] = useState<ToggleControlProps>(toggleDefaults)
  const [applied, setApplied] = useState<ToggleControlProps>(toggleDefaults)
  const [value, setValue] = useState(false)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
    setValue(draft.inputValue)
  }

  const computedClass = myMergeClasses(MyToggle_dftClass_Shared, applied.overrideClass)

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='inputName'>
            <MyInput value={draft.inputName} onChange={e => setDraft(d => ({ ...d, inputName: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='inputValue (start)'>
            <input type='checkbox' checked={draft.inputValue} onChange={e => setDraft(d => ({ ...d, inputValue: e.target.checked }))} />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea value={draft.overrideClass} onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))} overrideClass='w-full h-48' />
          </ControlRow>
          <ControlRow label='labelClass'>
            <MyInput value={draft.labelClass} onChange={e => setDraft(d => ({ ...d, labelClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyToggle
          inputName={applied.inputName}
          inputValue={value}
          overrideClass={applied.overrideClass}
          labelClass={applied.labelClass}
          onChange={e => setValue(e.target.checked)}
        />
      }
      returns={
        <>
          <ReturnRow label='value' value={String(value)} />
          <ReturnRow label='className' value={computedClass} />
        </>
      }
    />
  )
}

type PopupControlProps = { overrideClass: string; overlayClass: string; closeButtonClass: string; closeOnBackdropClick: boolean }
const popupDefaults: PopupControlProps = {
  overrideClass: '',
  overlayClass: 'fixed inset-0 flex justify-center items-center z-50',
  closeButtonClass: 'absolute top-3 right-3 text-2xl font-bold text-gray-500 hover:text-gray-800',
  closeOnBackdropClick: false,
}

//----------------------------------------------------------------------------------------------
//  MyPopupTab
//----------------------------------------------------------------------------------------------
function MyPopupTab() {
  const [draft, setDraft] = useState<PopupControlProps>(popupDefaults)
  const [applied, setApplied] = useState<PopupControlProps>(popupDefaults)
  const [isOpen, setIsOpen] = useState(false)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  const computedPanelClass = myMergeClasses(MyPopup_dftClass_Shared, applied.overrideClass)

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='overrideClass (panel)'>
            <MyTextarea value={draft.overrideClass} onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))} overrideClass='w-full h-48' />
          </ControlRow>
          <ControlRow label='overlayClass'>
            <MyTextarea value={draft.overlayClass} onChange={e => setDraft(d => ({ ...d, overlayClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='closeButtonClass'>
            <MyTextarea value={draft.closeButtonClass} onChange={e => setDraft(d => ({ ...d, closeButtonClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='closeOnBackdropClick'>
            <input type='checkbox' checked={draft.closeOnBackdropClick} onChange={e => setDraft(d => ({ ...d, closeOnBackdropClick: e.target.checked }))} />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <div className='flex flex-col gap-2'>
          <MyButton onClick={() => setIsOpen(true)}>Open Popup</MyButton>
          <MyPopup
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            overrideClass={applied.overrideClass}
            overlayClass={applied.overlayClass}
            closeButtonClass={applied.closeButtonClass}
            closeOnBackdropClick={applied.closeOnBackdropClick}
          >
            <p className='text-sm text-gray-700'>Popup content goes here.</p>
          </MyPopup>
        </div>
      }
      returns={
        <>
          <ReturnRow label='isOpen' value={String(isOpen)} />
          <ReturnRow label='panelClass' value={computedPanelClass} />
          <ReturnRow label='closeOnBackdropClick' value={String(applied.closeOnBackdropClick)} />
        </>
      }
    />
  )
}

type HourGlassControlProps = { overrideClass: string }
const hourGlassDefaults: HourGlassControlProps = { overrideClass: '' }

//----------------------------------------------------------------------------------------------
//  MyHourGlassTab
//----------------------------------------------------------------------------------------------
function MyHourGlassTab() {
  const [draft, setDraft] = useState<HourGlassControlProps>(hourGlassDefaults)
  const [applied, setApplied] = useState<HourGlassControlProps>(hourGlassDefaults)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  const computedHourClass = myMergeClasses(MyHourGlass_dftClass_Shared, applied.overrideClass)

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='overrideClass'>
            <MyTextarea value={draft.overrideClass} onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))} overrideClass='w-full h-48' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={<MyHourGlass overrideClass={applied.overrideClass} />}
      returns={<ReturnRow label='className' value={computedHourClass} />}
    />
  )
}

type HelpControlProps = { label: string; title: string; text: string; buttonClass: string; panelClass: string }
const helpDefaults: HelpControlProps = {
  label: '?',
  title: 'Help title',
  text: 'This is the help text explaining the field.',
  buttonClass: 'text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1.5 py-0.5 leading-none',
  panelClass: 'absolute z-10 mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs space-y-2 max-w-md shadow-md',
}

//----------------------------------------------------------------------------------------------
//  MyHelpTab
//----------------------------------------------------------------------------------------------
function MyHelpTab() {
  const [draft, setDraft] = useState<HelpControlProps>(helpDefaults)
  const [applied, setApplied] = useState<HelpControlProps>(helpDefaults)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='title'>
            <MyInput value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='text'>
            <MyTextarea value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='buttonClass'>
            <MyTextarea value={draft.buttonClass} onChange={e => setDraft(d => ({ ...d, buttonClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='panelClass'>
            <MyTextarea value={draft.panelClass} onChange={e => setDraft(d => ({ ...d, panelClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <div className='relative'>
          <MyHelp label={applied.label} title={applied.title} text={applied.text} buttonClass={applied.buttonClass} panelClass={applied.panelClass} />
          <span className='ml-2 text-xs text-gray-500'>click to toggle</span>
        </div>
      }
      returns={
        <>
          <ReturnRow label='label' value={applied.label} />
          <ReturnRow label='title' value={applied.title} />
        </>
      }
    />
  )
}

type HelpFieldControlProps = { text: string; triggerClass: string; tooltipClass: string }
const helpFieldDefaults: HelpFieldControlProps = {
  text: 'Tooltip help text shown on hover.',
  triggerClass: 'rounded-full w-4 h-4 text-xs font-bold border border-gray-300 text-gray-400 hover:text-blue-600 hover:border-blue-400 flex items-center justify-center flex-shrink-0 cursor-default select-none',
  tooltipClass: 'absolute left-0 top-full mt-1 z-50 w-64 bg-blue-50 border border-blue-200 text-gray-700 text-xs rounded px-2 py-1.5 shadow-md pointer-events-none whitespace-normal',
}

//----------------------------------------------------------------------------------------------
//  MyHelpFieldTab
//----------------------------------------------------------------------------------------------
function MyHelpFieldTab() {
  const [draft, setDraft] = useState<HelpFieldControlProps>(helpFieldDefaults)
  const [applied, setApplied] = useState<HelpFieldControlProps>(helpFieldDefaults)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='text'>
            <MyTextarea value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='triggerClass'>
            <MyTextarea value={draft.triggerClass} onChange={e => setDraft(d => ({ ...d, triggerClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='tooltipClass'>
            <MyTextarea value={draft.tooltipClass} onChange={e => setDraft(d => ({ ...d, tooltipClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <div className='relative flex items-center gap-2'>
          <span className='text-xs text-gray-500'>Hover the ?</span>
          <MyHelpField text={applied.text} triggerClass={applied.triggerClass} tooltipClass={applied.tooltipClass} />
        </div>
      }
      returns={<ReturnRow label='text' value={applied.text} />}
    />
  )
}

type HelpStepControlProps = { title: string; input: string; processing: string; output: string; consumers: string; label: string; buttonClass: string; panelClass: string }
const helpStepDefaults: HelpStepControlProps = {
  title: 'Process name',
  input: 'Input A,Input B',
  processing: 'Describe what happens here.',
  output: 'Output A,Output B',
  consumers: '',
  label: 'Help',
  buttonClass: 'text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1.5 py-0.5 leading-none',
  panelClass: 'absolute z-20 mt-1 p-4 bg-blue-50 border border-blue-200 rounded-md shadow-xl text-xs max-w-xl',
}

//----------------------------------------------------------------------------------------------
//  MyHelpStepTab
//----------------------------------------------------------------------------------------------
function MyHelpStepTab() {
  const [draft, setDraft] = useState<HelpStepControlProps>(helpStepDefaults)
  const [applied, setApplied] = useState<HelpStepControlProps>(helpStepDefaults)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  function parseList(s: string): string[] {
    const result = s.split(',').map(x => x.trim()).filter(Boolean)
    return result
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='title'>
            <MyInput value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='input (comma-sep)'>
            <MyInput value={draft.input} onChange={e => setDraft(d => ({ ...d, input: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='processing'>
            <MyInput value={draft.processing} onChange={e => setDraft(d => ({ ...d, processing: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='output (comma-sep)'>
            <MyInput value={draft.output} onChange={e => setDraft(d => ({ ...d, output: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='consumers (comma-sep)'>
            <MyInput value={draft.consumers} onChange={e => setDraft(d => ({ ...d, consumers: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='buttonClass'>
            <MyTextarea value={draft.buttonClass} onChange={e => setDraft(d => ({ ...d, buttonClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='panelClass'>
            <MyTextarea value={draft.panelClass} onChange={e => setDraft(d => ({ ...d, panelClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <div className='relative'>
          <MyHelpStep
            title={applied.title}
            input={parseList(applied.input)}
            processing={applied.processing}
            output={parseList(applied.output)}
            consumers={parseList(applied.consumers).length > 0 ? parseList(applied.consumers) : undefined}
            label={applied.label}
            buttonClass={applied.buttonClass}
            panelClass={applied.panelClass}
          />
          <span className='ml-2 text-xs text-gray-500'>click to toggle</span>
        </div>
      }
      returns={
        <>
          <ReturnRow label='title' value={applied.title} />
          <ReturnRow label='input' value={parseList(applied.input).join(', ')} />
          <ReturnRow label='output' value={parseList(applied.output).join(', ')} />
        </>
      }
    />
  )
}

type TabControlProps = { label: string; variant: 'underline' | 'pill'; overrideClass: string; restProps: string }
const tabDefaults: TabControlProps = { label: 'Tab A', variant: 'underline', overrideClass: '', restProps: '' }

//----------------------------------------------------------------------------------
//  MyTabTab
//----------------------------------------------------------------------------------
function MyTabTab() {
  const [draft, setDraft] = useState<TabControlProps>(tabDefaults)
  const [applied, setApplied] = useState<TabControlProps>(tabDefaults)
  const [active, setActive] = useState(false)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  const dftClass = applied.variant === 'pill'
    ? (active ? MyTab_pillActiveClass_Shared : MyTab_pillInactiveClass_Shared)
    : (active ? MyTab_underlineActiveClass_Shared : MyTab_underlineInactiveClass_Shared)
  const computedClass = myMergeClasses(dftClass, applied.overrideClass)

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='variant'>
            <MySelect
              options={['underline', 'pill']}
              value={draft.variant}
              onChange={e => setDraft(d => ({ ...d, variant: e.target.value as 'underline' | 'pill' }))}
            />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea
              value={draft.overrideClass}
              onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))}
              overrideClass='w-full h-48'
            />
          </ControlRow>
          <ControlRow label='rest props'>
            <MyTextarea
              value={draft.restProps}
              onChange={e => setDraft(d => ({ ...d, restProps: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <div className='flex items-center gap-2'>
          <MyTab
            variant={applied.variant}
            active={active}
            overrideClass={applied.overrideClass}
            {...parseRestProps(applied.restProps)}
            onClick={() => setActive(a => !a)}
          >
            {applied.label}
          </MyTab>
          <span className='text-xs text-gray-500'>click to toggle active</span>
        </div>
      }
      returns={
        <>
          <ReturnRow label='active' value={String(active)} />
          <ReturnRow label='variant' value={applied.variant} />
          <ReturnRow label='className' value={computedClass} />
          {Object.entries(parseRestProps(applied.restProps)).map(([k, v]) => (
            <ReturnRow key={k} label={k} value={v} />
          ))}
        </>
      }
    />
  )
}
