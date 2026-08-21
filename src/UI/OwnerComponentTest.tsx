'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import OwnerPage from './OwnerPage'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
import { MyTextarea } from '../components/MyTextarea'
import MyDropdown from '../components/MyDropdown'
import { myMergeClasses } from '../components/MyMergeClasses'
import MyCheckBox from '../components/MyCheckbox'
import { MyConfirmDialog, ConfirmDialogInt } from '../components/MyConfirmDialog'
import MyPagination from '../components/MyPagination'
import { MyLink } from '../components/MyLink'
import MySelect from '../components/MySelect'
import MySelectTable from '../components/MySelectTable'
import { MyToggle } from '../components/MyToggle'
import { MyLoadingMessage } from '../components/MyLoadingMessage'
import MyPopup from '../components/MyPopup'
import { MyHourGlass } from '../components/MyHourGlass'
import { MyHelp, HelpItem } from '../components/MyHelp'
import { MyHelpField } from '../components/MyHelpField'
import { MyHelpStep } from '../components/MyHelpStep'
import { MyTab } from '../components/MyTab'
import MySelectMulti from '../components/MySelectMulti'
import { isSelectionFiltering, serializeSelection } from '../components/isSelectionFiltering'
import MySelectRows from '../components/MySelectRows'
import MyPaginationFooter from '../components/MyPaginationFooter'
import { MyBackHomeNav } from '../components/MyBackHomeNav'
import MyBox from '../components/MyBox'
import {
  MyButton_dftClass,
  MyInput_dftClass,
  MyTextarea_dftClass,
  MyDropdown_dftClass,
  MyDropdown_labelDftClass,
  MyDropdown_searchDftClass,
  MyLink_dftClass,
  MySelect_dftClass,
  MySelect_labelDftClass,
  MySelect_containerDftClass,
  MySelect_searchDftClass,
  MyToggle_dftClass,
  MyPopup_dftClass,
  MyHourGlass_dftClass,
  MyTab_underlineActiveClass,
  MyTab_underlineInactiveClass,
  MyTab_pillActiveClass,
  MyTab_pillInactiveClass,
  MySelectMulti_dftClass,
  MySelectMulti_labelDftClass,
  MySelectMulti_containerDftClass,
  MySelectMulti_panelDftClass,
  MySelectMulti_panelWidthDftClass,
  MySelectMulti_panelMaxHeightDftClass,
  MySelectMulti_rowDftClass,
  MySelectMulti_selectAllRowDftClass,
  MySelectMulti_checkboxDftClass,
  MySelectRows_dftClass,
  MyPaginationFooter_dftClass,
  MyPaginationFooter_totalRowsClass,
  MyBackHomeNav_containerDftClass,
  MyBackHomeNav_linkDftClass,
  MyBox_dftClass,
  MyBox_titleDftClass,
  MyBox_toggleButtonDftClass,
  MyBox_chevronDftClass,
  MyCheckbox_labelDftClass,
  MyCheckbox_searchDftClass,
  MyCheckbox_containerDftClass,
  MyCheckbox_itemDftClass,
  MyPagination_dftClass,
  MyPagination_numbersContainerClass,
  MyPagination_ellipsisClass,
  MyPagination_numberClass,
  MyPagination_numberActiveClass,
  MyPagination_numberInactiveClass,
  MyPagination_arrowClass,
  MyPagination_arrowDisabledClass,
  MyPagination_arrowEnabledClass,
  MyPagination_arrowIconClass,
  MyHelp_closeButtonDftClass,
  MyHelpStep_closeButtonDftClass,
} from '../constants'

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
    { label: 'MyCheckBox', content: <MyCheckBoxTab /> },
    { label: 'MyPagination', content: <MyPaginationTab /> },
    { label: 'MyConfirmDialog', content: <MyConfirmDialogTab /> },
    { label: 'MyLink', content: <MyLinkTab /> },
    { label: 'MyDropdown', content: <MyDropdownTab /> },
    { label: 'MySelect', content: <MySelectTab /> },
    { label: 'MySelectTable', content: <MySelectTableTab /> },
    { label: 'MySelectMulti', content: <MySelectMultiTab /> },
    { label: 'MySelectRows', content: <MySelectRowsTab /> },
    { label: 'MyToggle', content: <MyToggleTab /> },
    { label: 'MyLoadingMessage', content: <MyLoadingMessageTab /> },
    { label: 'MyPopup', content: <MyPopupTab /> },
    { label: 'MyHourGlass', content: <MyHourGlassTab /> },
    { label: 'MyHelp', content: <MyHelpTab /> },
    { label: 'MyHelpField', content: <MyHelpFieldTab /> },
    { label: 'MyHelpStep', content: <MyHelpStepTab /> },
    { label: 'MyTab', content: <MyTabTab /> },
    { label: 'MyPaginationFooter', content: <MyPaginationFooterTab /> },
    { label: 'MyBackHomeNav', content: <MyBackHomeNavTab /> },
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
      <span className='text-gray-500 w-28 shrink-0'>{label}</span>
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
//  parseNumberList — parses a comma-separated string into a number[]
//----------------------------------------------------------------------------------
function parseNumberList(str: string): number[] {
  const result = str.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n))
  return result
}

//----------------------------------------------------------------------------------
//  parseTableData — parses "label,value" lines into row objects keyed by the given field names
//----------------------------------------------------------------------------------
function parseTableData(
  str: string,
  optionLabelField: string,
  optionValueField: string
): Array<Record<string, string>> {
  const result = str
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [label, value] = line.split(',').map(s => s.trim())
      return { [optionLabelField]: label ?? '', [optionValueField]: value ?? '' }
    })
  return result
}

//----------------------------------------------------------------------------------
//  parseLabelValueOptions — parses "Label,Value" lines into MySelect's {value,label}[] shape
//----------------------------------------------------------------------------------
function parseLabelValueOptions(str: string): { value: string; label: string }[] {
  const result = str
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [label, value] = line.split(',').map(s => s.trim())
      return { label: label ?? '', value: value ?? label ?? '' }
    })
  return result
}

//----------------------------------------------------------------------------------
//  parseHelpItems — parses "Heading: Body" lines into HelpItem[]
//----------------------------------------------------------------------------------
function parseHelpItems(str: string): HelpItem[] {
  const result = str
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [heading, ...rest] = line.split(':')
      return { heading: heading.trim(), body: rest.join(':').trim() }
    })
  return result
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

type BtnProps = { label: string; defaultClass: string; overrideClass: string; restProps: string }
const btnDefaults: BtnProps = { label: 'Click me', defaultClass: MyButton_dftClass, overrideClass: '', restProps: 'aria-disabled="true"' }

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
          <ControlRow label='defaultClass'>
            <MyTextarea
              value={draft.defaultClass}
              onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))}
              overrideClass='w-full h-16'
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
        <MyButton
          defaultClass={applied.defaultClass}
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
          <ReturnRow label='className' value={myMergeClasses(applied.defaultClass, applied.overrideClass)} />
          {Object.entries(parseRestProps(applied.restProps)).map(([k, v]) => (
            <ReturnRow key={k} label={k} value={v} />
          ))}
        </>
      }
    />
  )
}

type InputProps = { placeholder: string; type: string; defaultClass: string; overrideClass: string; disabled: boolean; restProps: string }
const inputDefaults: InputProps = { placeholder: 'Enter text', type: 'text', defaultClass: MyInput_dftClass, overrideClass: '', disabled: false, restProps: 'aria-disabled="true"' }

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
          <ControlRow label='defaultClass'>
            <MyTextarea
              value={draft.defaultClass}
              onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))}
              overrideClass='w-full h-16'
            />
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
          defaultClass={applied.defaultClass}
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
          <ReturnRow label='className' value={myMergeClasses(applied.defaultClass, applied.overrideClass)} />
          {Object.entries(parseRestProps(applied.restProps)).map(([k, v]) => (
            <ReturnRow key={k} label={k} value={v} />
          ))}
        </>
      }
    />
  )
}

type TextareaProps = { placeholder: string; defaultClass: string; overrideClass: string; disabled: boolean; restProps: string }
const textareaDefaults: TextareaProps = { placeholder: 'Enter text', defaultClass: MyTextarea_dftClass, overrideClass: '', disabled: false, restProps: 'aria-disabled="true"' }

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
          <ControlRow label='defaultClass'>
            <MyTextarea
              value={draft.defaultClass}
              onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))}
              overrideClass='w-full h-16'
            />
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
          defaultClass={applied.defaultClass}
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
          <ReturnRow label='className' value={myMergeClasses(applied.defaultClass, applied.overrideClass)} />
          {Object.entries(parseRestProps(applied.restProps)).map(([k, v]) => (
            <ReturnRow key={k} label={k} value={v} />
          ))}
        </>
      }
    />
  )
}

type BoxProps = {
  title: string
  content: string
  defaultClass: string
  className: string
  titleClass: string
  toggleButtonClass: string
  chevronClass: string
  collapsible: boolean
  defaultOpen: boolean
}
const boxDefaults: BoxProps = {
  title: 'Box Title',
  content: 'Box content',
  defaultClass: MyBox_dftClass,
  className: '',
  titleClass: MyBox_titleDftClass,
  toggleButtonClass: MyBox_toggleButtonDftClass,
  chevronClass: MyBox_chevronDftClass,
  collapsible: false,
  defaultOpen: true,
}

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
          <ControlRow label='defaultClass'>
            <MyTextarea
              value={draft.defaultClass}
              onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <ControlRow label='className (override)'>
            <MyTextarea
              value={draft.className}
              onChange={e => setDraft(d => ({ ...d, className: e.target.value }))}
              overrideClass='w-full h-48'
            />
          </ControlRow>
          <ControlRow label='titleClass'>
            <MyTextarea
              value={draft.titleClass}
              onChange={e => setDraft(d => ({ ...d, titleClass: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <ControlRow label='toggleButtonClass'>
            <MyTextarea
              value={draft.toggleButtonClass}
              onChange={e => setDraft(d => ({ ...d, toggleButtonClass: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <ControlRow label='chevronClass'>
            <MyTextarea
              value={draft.chevronClass}
              onChange={e => setDraft(d => ({ ...d, chevronClass: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <ControlRow label='collapsible'>
            <input type='checkbox' checked={draft.collapsible} onChange={e => setDraft(d => ({ ...d, collapsible: e.target.checked }))} />
          </ControlRow>
          <ControlRow label='defaultOpen'>
            <input type='checkbox' checked={draft.defaultOpen} onChange={e => setDraft(d => ({ ...d, defaultOpen: e.target.checked }))} />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyBox
          key={`${applied.collapsible}-${applied.defaultOpen}`}
          title={applied.title}
          defaultClass={applied.defaultClass}
          className={applied.className}
          titleClass={applied.titleClass}
          toggleButtonClass={applied.toggleButtonClass}
          chevronClass={applied.chevronClass}
          collapsible={applied.collapsible}
          defaultOpen={applied.defaultOpen}
        >
          <p className='text-xs'>{applied.content}</p>
        </MyBox>
      }
      returns={
        <>
          <ReturnRow label='title' value={applied.title || '(none)'} />
          <ReturnRow label='defaultClass' value={applied.defaultClass} />
          <ReturnRow label='className' value={myMergeClasses(applied.defaultClass, applied.className)} />
          <ReturnRow label='titleClass' value={applied.titleClass} />
          <ReturnRow label='toggleButtonClass' value={applied.toggleButtonClass} />
          <ReturnRow label='chevronClass' value={applied.chevronClass} />
          <ReturnRow label='collapsible' value={String(applied.collapsible)} />
          <ReturnRow label='defaultOpen' value={String(applied.defaultOpen)} />
        </>
      }
    />
  )
}

type DropdownControlProps = {
  mode: 'tableData' | 'table'
  label: string
  name: string
  optionLabel: string
  optionValue: string
  tableDataText: string
  table: string
  whereColumn1: string
  whereValue1: string
  whereColumn2: string
  whereValue2: string
  orderBy: string
  defaultClass: string
  defaultClass_Label: string
  defaultClass_Search: string
  overrideClass_Label: string
  overrideClass_Search: string
  overrideClass_Dropdown: string
  includeBlank: boolean
  searchEnabled: boolean
}
const dropdownDefaults: DropdownControlProps = {
  mode: 'tableData',
  label: 'Pick one',
  name: 'colour',
  optionLabel: 'col_label',
  optionValue: 'col_value',
  tableDataText: 'Red,red\nGreen,green\nBlue,blue\nYellow,yellow\nPurple,purple',
  table: 'xlg_logging',
  whereColumn1: '',
  whereValue1: '',
  whereColumn2: '',
  whereValue2: '',
  orderBy: '',
  defaultClass: MyDropdown_dftClass,
  defaultClass_Label: MyDropdown_labelDftClass,
  defaultClass_Search: MyDropdown_searchDftClass,
  overrideClass_Label: '',
  overrideClass_Search: '',
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

  const whereColumnValuePairs = useMemo(() => {
    const pairs = [
      { column: applied.whereColumn1, value: applied.whereValue1 },
      { column: applied.whereColumn2, value: applied.whereValue2 }
    ].filter(pair => pair.column && pair.value)
    return pairs.length > 0 ? pairs : undefined
  }, [applied.whereColumn1, applied.whereValue1, applied.whereColumn2, applied.whereValue2])

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='mode'>
            <label className='mr-3 text-xs'>
              <input type='radio' name='dropdown-mode' checked={draft.mode === 'tableData'} onChange={() => setDraft(d => ({ ...d, mode: 'tableData' }))} /> tableData
            </label>
            <label className='text-xs'>
              <input type='radio' name='dropdown-mode' checked={draft.mode === 'table'} onChange={() => setDraft(d => ({ ...d, mode: 'table' }))} /> table
            </label>
          </ControlRow>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='name'>
            <MyInput value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='optionLabel'>
            <MyInput value={draft.optionLabel} onChange={e => setDraft(d => ({ ...d, optionLabel: e.target.value }))} overrideClass='w-full' placeholder='e.g. col_label / lg_functionname' />
          </ControlRow>
          <ControlRow label='optionValue'>
            <MyInput value={draft.optionValue} onChange={e => setDraft(d => ({ ...d, optionValue: e.target.value }))} overrideClass='w-full' placeholder='e.g. col_value / lg_functionname' />
          </ControlRow>
          <ControlRow label='tableData (mode=tableData, "label,value" per line)'>
            <MyTextarea value={draft.tableDataText} onChange={e => setDraft(d => ({ ...d, tableDataText: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='table (mode=table)'>
            <MyInput value={draft.table} onChange={e => setDraft(d => ({ ...d, table: e.target.value }))} overrideClass='w-full' placeholder='e.g. xlg_logging' />
          </ControlRow>
          <ControlRow label='whereColumn 1 (mode=table)'>
            <MyInput value={draft.whereColumn1} onChange={e => setDraft(d => ({ ...d, whereColumn1: e.target.value }))} overrideClass='w-full' placeholder='e.g. lg_severity' />
          </ControlRow>
          <ControlRow label='whereValue 1 (mode=table)'>
            <MyInput value={draft.whereValue1} onChange={e => setDraft(d => ({ ...d, whereValue1: e.target.value }))} overrideClass='w-full' placeholder='e.g. E' />
          </ControlRow>
          <ControlRow label='whereColumn 2 (mode=table)'>
            <MyInput value={draft.whereColumn2} onChange={e => setDraft(d => ({ ...d, whereColumn2: e.target.value }))} overrideClass='w-full' placeholder='e.g. lg_caller' />
          </ControlRow>
          <ControlRow label='whereValue 2 (mode=table)'>
            <MyInput value={draft.whereValue2} onChange={e => setDraft(d => ({ ...d, whereValue2: e.target.value }))} overrideClass='w-full' placeholder='e.g. test-app' />
          </ControlRow>
          <ControlRow label='orderBy'>
            <MyInput value={draft.orderBy} onChange={e => setDraft(d => ({ ...d, orderBy: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='defaultClass'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass_Dropdown'>
            <MyTextarea
              value={draft.overrideClass_Dropdown}
              onChange={e => setDraft(d => ({ ...d, overrideClass_Dropdown: e.target.value }))}
              overrideClass='w-full h-48'
            />
          </ControlRow>
          <ControlRow label='defaultClass_Label'>
            <MyTextarea value={draft.defaultClass_Label} onChange={e => setDraft(d => ({ ...d, defaultClass_Label: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='defaultClass_Search'>
            <MyTextarea value={draft.defaultClass_Search} onChange={e => setDraft(d => ({ ...d, defaultClass_Search: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass_Label'>
            <MyTextarea value={draft.overrideClass_Label} onChange={e => setDraft(d => ({ ...d, overrideClass_Label: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass_Search'>
            <MyTextarea value={draft.overrideClass_Search} onChange={e => setDraft(d => ({ ...d, overrideClass_Search: e.target.value }))} overrideClass='w-full h-16' />
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
          tableData={
            applied.mode === 'tableData'
              ? parseTableData(applied.tableDataText, applied.optionLabel, applied.optionValue)
              : undefined
          }
          table={applied.mode === 'table' ? applied.table : undefined}
          whereColumnValuePairs={applied.mode === 'table' ? whereColumnValuePairs : undefined}
          orderBy={applied.orderBy}
          optionLabel={applied.optionLabel}
          optionValue={applied.optionValue}
          label={applied.label}
          name={applied.name}
          includeBlank={applied.includeBlank}
          searchEnabled={applied.searchEnabled}
          defaultClass={applied.defaultClass}
          defaultClass_Label={applied.defaultClass_Label}
          defaultClass_Search={applied.defaultClass_Search}
          overrideClass_Label={applied.overrideClass_Label}
          overrideClass_Search={applied.overrideClass_Search}
          overrideClass_Dropdown={applied.overrideClass_Dropdown}
        />
      }
      returns={
        <>
          <ReturnRow label='selectedOption' value={selectedOption !== '' ? String(selectedOption) : '(none)'} />
          <ReturnRow label='type' value={selectedOption !== '' ? typeof selectedOption : '—'} />
          <ReturnRow
            label='tableData'
            value={
              applied.mode === 'tableData'
                ? JSON.stringify(parseTableData(applied.tableDataText, applied.optionLabel, applied.optionValue))
                : '(unused)'
            }
          />
          <ReturnRow label='className' value={myMergeClasses(applied.defaultClass, applied.overrideClass_Dropdown)} />
          <ReturnRow label='labelClassName' value={myMergeClasses(applied.defaultClass_Label, applied.overrideClass_Label)} />
          <ReturnRow label='searchClassName' value={myMergeClasses(applied.defaultClass_Search, applied.overrideClass_Search)} />
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
  sortBy: 'value' | 'label'
  defaultClass_Label: string
  defaultClass_Search: string
  defaultClass_Container: string
  defaultClass_CheckboxItem: string
  overrideClass_Label: string
  overrideClass_Search: string
  overrideClass_Container: string
  overrideClass_CheckboxItem: string
}
const checkboxDefaults: CheckBoxControlProps = {
  label: 'Select items',
  searchEnabled: true,
  showSelectedCount: true,
  showResortButton: true,
  maxSelections: '',
  minSelections: '',
  sortBy: 'label',
  defaultClass_Label: MyCheckbox_labelDftClass,
  defaultClass_Search: MyCheckbox_searchDftClass,
  defaultClass_Container: MyCheckbox_containerDftClass,
  defaultClass_CheckboxItem: MyCheckbox_itemDftClass,
  overrideClass_Label: '',
  overrideClass_Search: '',
  overrideClass_Container: '',
  overrideClass_CheckboxItem: '',
}

//----------------------------------------------------------------------------------
//  MyCheckBoxTab
//----------------------------------------------------------------------------------
function MyCheckBoxTab() {
  const [draft, setDraft] = useState<CheckBoxControlProps>(checkboxDefaults)
  const [applied, setApplied] = useState<CheckBoxControlProps>(checkboxDefaults)
  const [selected, setSelected] = useState<Array<string | number>>([])
  const [errorMessage, setErrorMessage] = useState('')

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
          <ControlRow label='sortBy'>
            <label className='mr-3 text-xs'>
              <input type='radio' name='checkbox-sortBy' checked={draft.sortBy === 'label'} onChange={() => setDraft(d => ({ ...d, sortBy: 'label' }))} /> label
            </label>
            <label className='text-xs'>
              <input type='radio' name='checkbox-sortBy' checked={draft.sortBy === 'value'} onChange={() => setDraft(d => ({ ...d, sortBy: 'value' }))} /> value
            </label>
          </ControlRow>
          <ControlRow label='defaultClass_Label'>
            <MyTextarea value={draft.defaultClass_Label} onChange={e => setDraft(d => ({ ...d, defaultClass_Label: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='defaultClass_Search'>
            <MyTextarea value={draft.defaultClass_Search} onChange={e => setDraft(d => ({ ...d, defaultClass_Search: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='defaultClass_Container'>
            <MyTextarea value={draft.defaultClass_Container} onChange={e => setDraft(d => ({ ...d, defaultClass_Container: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='defaultClass_CheckboxItem'>
            <MyTextarea value={draft.defaultClass_CheckboxItem} onChange={e => setDraft(d => ({ ...d, defaultClass_CheckboxItem: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass_Label'>
            <MyTextarea value={draft.overrideClass_Label} onChange={e => setDraft(d => ({ ...d, overrideClass_Label: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass_Search'>
            <MyTextarea value={draft.overrideClass_Search} onChange={e => setDraft(d => ({ ...d, overrideClass_Search: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass_Container'>
            <MyTextarea value={draft.overrideClass_Container} onChange={e => setDraft(d => ({ ...d, overrideClass_Container: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass_CheckboxItem'>
            <MyTextarea value={draft.overrideClass_CheckboxItem} onChange={e => setDraft(d => ({ ...d, overrideClass_CheckboxItem: e.target.value }))} overrideClass='w-full h-16' />
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
          sortBy={applied.sortBy}
          defaultClass_Label={applied.defaultClass_Label}
          defaultClass_Search={applied.defaultClass_Search}
          defaultClass_Container={applied.defaultClass_Container}
          defaultClass_CheckboxItem={applied.defaultClass_CheckboxItem}
          overrideClass_Label={applied.overrideClass_Label}
          overrideClass_Search={applied.overrideClass_Search}
          overrideClass_Container={applied.overrideClass_Container}
          overrideClass_CheckboxItem={applied.overrideClass_CheckboxItem}
          onError={setErrorMessage}
        />
      }
      returns={
        <>
          <ReturnRow label='count' value={String(selected.length)} />
          <ReturnRow label='selected' value={selected.length > 0 ? selected.join(', ') : '(none)'} />
          <ReturnRow label='error' value={errorMessage || '(none)'} />
          <ReturnRow label='labelClassName' value={myMergeClasses(applied.defaultClass_Label, applied.overrideClass_Label)} />
          <ReturnRow label='searchClassName' value={myMergeClasses(applied.defaultClass_Search, applied.overrideClass_Search)} />
          <ReturnRow label='containerClassName' value={myMergeClasses(applied.defaultClass_Container, applied.overrideClass_Container)} />
          <ReturnRow label='checkboxItemClassName' value={myMergeClasses(applied.defaultClass_CheckboxItem, applied.overrideClass_CheckboxItem)} />
        </>
      }
    />
  )
}

type PaginationControlProps = {
  totalPages: string
  defaultClass: string
  overrideClass: string
  numbersContainerClass: string
  ellipsisClass: string
  numberClass: string
  numberActiveClass: string
  numberInactiveClass: string
  arrowClass: string
  arrowDisabledClass: string
  arrowEnabledClass: string
  arrowIconClass: string
}
const paginationDefaults: PaginationControlProps = {
  totalPages: '10',
  defaultClass: MyPagination_dftClass,
  overrideClass: '',
  numbersContainerClass: MyPagination_numbersContainerClass,
  ellipsisClass: MyPagination_ellipsisClass,
  numberClass: MyPagination_numberClass,
  numberActiveClass: MyPagination_numberActiveClass,
  numberInactiveClass: MyPagination_numberInactiveClass,
  arrowClass: MyPagination_arrowClass,
  arrowDisabledClass: MyPagination_arrowDisabledClass,
  arrowEnabledClass: MyPagination_arrowEnabledClass,
  arrowIconClass: MyPagination_arrowIconClass,
}

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
          <ControlRow label='defaultClass'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea value={draft.overrideClass} onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))} overrideClass='w-full h-48' />
          </ControlRow>
          <ControlRow label='numbersContainerClass'>
            <MyTextarea value={draft.numbersContainerClass} onChange={e => setDraft(d => ({ ...d, numbersContainerClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='ellipsisClass'>
            <MyTextarea value={draft.ellipsisClass} onChange={e => setDraft(d => ({ ...d, ellipsisClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='numberClass'>
            <MyTextarea value={draft.numberClass} onChange={e => setDraft(d => ({ ...d, numberClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='numberActiveClass'>
            <MyTextarea value={draft.numberActiveClass} onChange={e => setDraft(d => ({ ...d, numberActiveClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='numberInactiveClass'>
            <MyTextarea value={draft.numberInactiveClass} onChange={e => setDraft(d => ({ ...d, numberInactiveClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='arrowClass'>
            <MyTextarea value={draft.arrowClass} onChange={e => setDraft(d => ({ ...d, arrowClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='arrowDisabledClass'>
            <MyTextarea value={draft.arrowDisabledClass} onChange={e => setDraft(d => ({ ...d, arrowDisabledClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='arrowEnabledClass'>
            <MyTextarea value={draft.arrowEnabledClass} onChange={e => setDraft(d => ({ ...d, arrowEnabledClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='arrowIconClass'>
            <MyTextarea value={draft.arrowIconClass} onChange={e => setDraft(d => ({ ...d, arrowIconClass: e.target.value }))} overrideClass='w-full h-16' />
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
          defaultClass={applied.defaultClass}
          overrideClass={applied.overrideClass}
          numbersContainerClass={applied.numbersContainerClass}
          ellipsisClass={applied.ellipsisClass}
          numberClass={applied.numberClass}
          numberActiveClass={applied.numberActiveClass}
          numberInactiveClass={applied.numberInactiveClass}
          arrowClass={applied.arrowClass}
          arrowDisabledClass={applied.arrowDisabledClass}
          arrowEnabledClass={applied.arrowEnabledClass}
          arrowIconClass={applied.arrowIconClass}
        />
      }
      returns={
        <>
          <ReturnRow label='currentPage' value={String(currentPage)} />
          <ReturnRow label='totalPages' value={applied.totalPages || '1'} />
          <ReturnRow label='className' value={myMergeClasses(applied.defaultClass, applied.overrideClass)} />
          <ReturnRow label='numbersContainerClass' value={applied.numbersContainerClass} />
          <ReturnRow label='ellipsisClass' value={applied.ellipsisClass} />
          <ReturnRow label='numberClass' value={applied.numberClass} />
          <ReturnRow label='numberActiveClass' value={applied.numberActiveClass} />
          <ReturnRow label='numberInactiveClass' value={applied.numberInactiveClass} />
          <ReturnRow label='arrowClass' value={applied.arrowClass} />
          <ReturnRow label='arrowDisabledClass' value={applied.arrowDisabledClass} />
          <ReturnRow label='arrowEnabledClass' value={applied.arrowEnabledClass} />
          <ReturnRow label='arrowIconClass' value={applied.arrowIconClass} />
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
  line3: string
  line4: string
  line5: string
  line6: string
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
  line3: '',
  line4: '',
  line5: '',
  line6: '',
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
      line3: applied.line3 || undefined,
      line4: applied.line4 || undefined,
      line5: applied.line5 || undefined,
      line6: applied.line6 || undefined,
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
          <ControlRow label='line3'>
            <MyInput value={draft.line3} onChange={e => setDraft(d => ({ ...d, line3: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='line4'>
            <MyInput value={draft.line4} onChange={e => setDraft(d => ({ ...d, line4: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='line5'>
            <MyInput value={draft.line5} onChange={e => setDraft(d => ({ ...d, line5: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='line6'>
            <MyInput value={draft.line6} onChange={e => setDraft(d => ({ ...d, line6: e.target.value }))} overrideClass='w-full' />
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

type LinkControlProps = { label: string; pathname: string; defaultClass: string; overrideClass: string; caller: string; restProps: string }
const linkDefaults: LinkControlProps = {
  label: 'Go to page',
  pathname: '/owner',
  defaultClass: MyLink_dftClass,
  overrideClass: '',
  caller: '',
  restProps: 'aria-disabled="true"',
}

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

  const computedClass = myMergeClasses(applied.defaultClass, applied.overrideClass)

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
          <ControlRow label='defaultClass'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea value={draft.overrideClass} onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))} overrideClass='w-full h-48' />
          </ControlRow>
          <ControlRow label='caller'>
            <MyInput value={draft.caller} onChange={e => setDraft(d => ({ ...d, caller: e.target.value }))} overrideClass='w-full' />
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
        <MyLink
          href={{ reference: 'test', pathname: applied.pathname || '#' }}
          defaultClass={applied.defaultClass}
          overrideClass={applied.overrideClass}
          caller={applied.caller}
          {...parseRestProps(applied.restProps)}
        >
          {applied.label || ' '}
        </MyLink>
      }
      returns={
        <>
          <ReturnRow label='className' value={computedClass} />
          <ReturnRow label='caller' value={applied.caller || '(none)'} />
          {Object.entries(parseRestProps(applied.restProps)).map(([k, v]) => (
            <ReturnRow key={k} label={k} value={v} />
          ))}
        </>
      }
    />
  )
}

type SelectControlProps = {
  label: string
  optionsMode: 'flat' | 'labelValue'
  options: string
  labelValueOptions: string
  defaultClass: string
  overrideClass: string
  labelClass: string
  containerClass: string
  searchEnabled: boolean
  includeBlank: boolean
  searchClass: string
}
const selectDefaults: SelectControlProps = {
  label: 'Pick one',
  optionsMode: 'flat',
  options: 'Apple,Banana,Cherry',
  labelValueOptions: 'United States,US\nUnited Kingdom,UK\nFrance,FR',
  defaultClass: MySelect_dftClass,
  overrideClass: '',
  labelClass: 'font-bold text-xs whitespace-nowrap',
  containerClass: 'flex items-center gap-2',
  searchEnabled: false,
  includeBlank: false,
  searchClass: '',
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

  const parsedOptions =
    applied.optionsMode === 'labelValue'
      ? parseLabelValueOptions(applied.labelValueOptions)
      : applied.options.split(',').map(o => o.trim()).filter(Boolean)
  const computedClass = myMergeClasses(applied.defaultClass, applied.overrideClass)

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='optionsMode'>
            <div className='flex items-center gap-3'>
              <label className='flex items-center gap-1 text-xs'>
                <input
                  type='radio'
                  name='optionsMode'
                  checked={draft.optionsMode === 'flat'}
                  onChange={() => setDraft(d => ({ ...d, optionsMode: 'flat' }))}
                />
                flat
              </label>
              <label className='flex items-center gap-1 text-xs'>
                <input
                  type='radio'
                  name='optionsMode'
                  checked={draft.optionsMode === 'labelValue'}
                  onChange={() => setDraft(d => ({ ...d, optionsMode: 'labelValue' }))}
                />
                labelValue
              </label>
            </div>
          </ControlRow>
          <ControlRow label='options (comma-sep)'>
            <MyInput value={draft.options} onChange={e => setDraft(d => ({ ...d, options: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='labelValue options (Label,Value per line)'>
            <MyTextarea value={draft.labelValueOptions} onChange={e => setDraft(d => ({ ...d, labelValueOptions: e.target.value }))} overrideClass='w-full h-24' />
          </ControlRow>
          <ControlRow label='defaultClass'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
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
          <ControlRow label='searchEnabled'>
            <input type='checkbox' checked={draft.searchEnabled} onChange={e => setDraft(d => ({ ...d, searchEnabled: e.target.checked }))} />
          </ControlRow>
          <ControlRow label='includeBlank'>
            <input type='checkbox' checked={draft.includeBlank} onChange={e => setDraft(d => ({ ...d, includeBlank: e.target.checked }))} />
          </ControlRow>
          <ControlRow label='searchClass'>
            <MyTextarea value={draft.searchClass} onChange={e => setDraft(d => ({ ...d, searchClass: e.target.value }))} overrideClass='w-full h-16' />
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
          defaultClass={applied.defaultClass}
          overrideClass={applied.overrideClass}
          labelClass={applied.labelClass}
          containerClass={applied.containerClass}
          searchEnabled={applied.searchEnabled}
          includeBlank={applied.includeBlank}
          searchClass={applied.searchClass}
          value={selected}
          onChange={e => setSelected(e.target.value)}
        />
      }
      returns={
        <>
          <ReturnRow label='selected' value={selected || '(none)'} />
          <ReturnRow label='className' value={computedClass} />
          <ReturnRow label='searchClassName' value={myMergeClasses(MySelect_searchDftClass, applied.searchClass)} />
        </>
      }
    />
  )
}

type SelectTableControlProps = {
  label: string
  table: string
  optionLabel: string
  optionValue: string
  name: string
  defaultClass: string
  overrideClass_Dropdown: string
  includeBlank: boolean
  searchEnabled: boolean
  whereColumn1: string
  whereValue1: string
  whereColumn2: string
  whereValue2: string
  orderBy: string
  defaultClass_Label: string
  defaultClass_Search: string
  overrideClass_Label: string
  overrideClass_Search: string
}
const selectTableDefaults: SelectTableControlProps = {
  label: 'Function name',
  table: 'xlg_logging',
  optionLabel: 'lg_functionname',
  optionValue: 'lg_functionname',
  name: 'lg_functionname',
  defaultClass: MyDropdown_dftClass,
  overrideClass_Dropdown: 'w-72',
  includeBlank: true,
  searchEnabled: true,
  whereColumn1: '',
  whereValue1: '',
  whereColumn2: '',
  whereValue2: '',
  orderBy: '',
  defaultClass_Label: MyDropdown_labelDftClass,
  defaultClass_Search: MyDropdown_searchDftClass,
  overrideClass_Label: '',
  overrideClass_Search: '',
}

//----------------------------------------------------------------------------------
//  MySelectTableTab
//----------------------------------------------------------------------------------
function MySelectTableTab() {
  const [draft, setDraft] = useState<SelectTableControlProps>(selectTableDefaults)
  const [applied, setApplied] = useState<SelectTableControlProps>(selectTableDefaults)
  const [selectedOption, setSelectedOption] = useState<string | number>('')

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
    setSelectedOption('')
  }

  const whereColumnValuePairs = useMemo(() => {
    const pairs = [
      { column: applied.whereColumn1, value: applied.whereValue1 },
      { column: applied.whereColumn2, value: applied.whereValue2 }
    ].filter(pair => pair.column && pair.value)
    return pairs.length > 0 ? pairs : undefined
  }, [applied.whereColumn1, applied.whereValue1, applied.whereColumn2, applied.whereValue2])

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='table'>
            <MyInput value={draft.table} onChange={e => setDraft(d => ({ ...d, table: e.target.value }))} overrideClass='w-full' placeholder='e.g. xlg_logging' />
          </ControlRow>
          <ControlRow label='optionLabel'>
            <MyInput value={draft.optionLabel} onChange={e => setDraft(d => ({ ...d, optionLabel: e.target.value }))} overrideClass='w-full' placeholder='e.g. lg_functionname' />
          </ControlRow>
          <ControlRow label='optionValue'>
            <MyInput value={draft.optionValue} onChange={e => setDraft(d => ({ ...d, optionValue: e.target.value }))} overrideClass='w-full' placeholder='e.g. lg_functionname' />
          </ControlRow>
          <ControlRow label='name'>
            <MyInput value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='defaultClass'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
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
          <ControlRow label='whereColumn 1'>
            <MyInput value={draft.whereColumn1} onChange={e => setDraft(d => ({ ...d, whereColumn1: e.target.value }))} overrideClass='w-full' placeholder='e.g. lg_severity' />
          </ControlRow>
          <ControlRow label='whereValue 1'>
            <MyInput value={draft.whereValue1} onChange={e => setDraft(d => ({ ...d, whereValue1: e.target.value }))} overrideClass='w-full' placeholder='e.g. E' />
          </ControlRow>
          <ControlRow label='whereColumn 2'>
            <MyInput value={draft.whereColumn2} onChange={e => setDraft(d => ({ ...d, whereColumn2: e.target.value }))} overrideClass='w-full' placeholder='e.g. lg_caller' />
          </ControlRow>
          <ControlRow label='whereValue 2'>
            <MyInput value={draft.whereValue2} onChange={e => setDraft(d => ({ ...d, whereValue2: e.target.value }))} overrideClass='w-full' placeholder='e.g. test-app' />
          </ControlRow>
          <ControlRow label='orderBy'>
            <MyInput value={draft.orderBy} onChange={e => setDraft(d => ({ ...d, orderBy: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='defaultClass_Label'>
            <MyTextarea
              value={draft.defaultClass_Label}
              onChange={e => setDraft(d => ({ ...d, defaultClass_Label: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <ControlRow label='defaultClass_Search'>
            <MyTextarea
              value={draft.defaultClass_Search}
              onChange={e => setDraft(d => ({ ...d, defaultClass_Search: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <ControlRow label='overrideClass_Label'>
            <MyTextarea
              value={draft.overrideClass_Label}
              onChange={e => setDraft(d => ({ ...d, overrideClass_Label: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <ControlRow label='overrideClass_Search'>
            <MyTextarea
              value={draft.overrideClass_Search}
              onChange={e => setDraft(d => ({ ...d, overrideClass_Search: e.target.value }))}
              overrideClass='w-full h-16'
            />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MySelectTable
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          table={applied.table}
          optionLabel={applied.optionLabel}
          optionValue={applied.optionValue}
          label={applied.label}
          name={applied.name}
          includeBlank={applied.includeBlank}
          searchEnabled={applied.searchEnabled}
          defaultClass={applied.defaultClass}
          overrideClass_Dropdown={applied.overrideClass_Dropdown}
          whereColumnValuePairs={whereColumnValuePairs}
          orderBy={applied.orderBy}
          defaultClass_Label={applied.defaultClass_Label}
          defaultClass_Search={applied.defaultClass_Search}
          overrideClass_Label={applied.overrideClass_Label}
          overrideClass_Search={applied.overrideClass_Search}
        />
      }
      returns={
        <>
          <ReturnRow label='selectedOption' value={selectedOption !== '' ? String(selectedOption) : '(none)'} />
          <ReturnRow label='type' value={selectedOption !== '' ? typeof selectedOption : '—'} />
          <ReturnRow label='className' value={myMergeClasses(applied.defaultClass, applied.overrideClass_Dropdown)} />
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

type ToggleControlProps = { inputName: string; inputValue: boolean; defaultClass: string; overrideClass: string; labelClass: string }
const toggleDefaults: ToggleControlProps = {
  inputName: 'my-toggle',
  inputValue: false,
  defaultClass: MyToggle_dftClass,
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

  const computedClass = myMergeClasses(applied.defaultClass, applied.overrideClass)

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
          <ControlRow label='defaultClass'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
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
          defaultClass={applied.defaultClass}
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

type PopupControlProps = { defaultClass: string; overrideClass: string; overlayClass: string; closeButtonClass: string; closeOnBackdropClick: boolean }
const popupDefaults: PopupControlProps = {
  defaultClass: MyPopup_dftClass,
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

  const computedPanelClass = myMergeClasses(applied.defaultClass, applied.overrideClass)

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='defaultClass (panel)'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
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
            defaultClass={applied.defaultClass}
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

type HourGlassControlProps = { defaultClass: string; overrideClass: string }
const hourGlassDefaults: HourGlassControlProps = { defaultClass: MyHourGlass_dftClass, overrideClass: '' }

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

  const computedHourClass = myMergeClasses(applied.defaultClass, applied.overrideClass)

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='defaultClass'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea value={draft.overrideClass} onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))} overrideClass='w-full h-48' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={<MyHourGlass defaultClass={applied.defaultClass} overrideClass={applied.overrideClass} />}
      returns={<ReturnRow label='className' value={computedHourClass} />}
    />
  )
}

type HelpControlProps = {
  label: string
  title: string
  mode: 'text' | 'items'
  text: string
  itemsText: string
  buttonClass: string
  panelClass: string
  closeButtonClass: string
}
const helpDefaults: HelpControlProps = {
  label: '?',
  title: 'Help title',
  mode: 'text',
  text: 'This is the help text explaining the field.',
  itemsText: 'First item: Details about the first item.\nSecond item: Details about the second item.',
  buttonClass: 'text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1.5 py-0.5 leading-none',
  panelClass: 'absolute z-10 mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs space-y-2 max-w-md shadow-md',
  closeButtonClass: MyHelp_closeButtonDftClass,
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
          <ControlRow label='mode'>
            <label className='mr-3 text-xs'>
              <input type='radio' name='help-mode' checked={draft.mode === 'text'} onChange={() => setDraft(d => ({ ...d, mode: 'text' }))} /> text
            </label>
            <label className='text-xs'>
              <input type='radio' name='help-mode' checked={draft.mode === 'items'} onChange={() => setDraft(d => ({ ...d, mode: 'items' }))} /> items
            </label>
          </ControlRow>
          <ControlRow label='text (mode=text)'>
            <MyTextarea value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='items (mode=items, "Heading: Body" per line)'>
            <MyTextarea value={draft.itemsText} onChange={e => setDraft(d => ({ ...d, itemsText: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='buttonClass'>
            <MyTextarea value={draft.buttonClass} onChange={e => setDraft(d => ({ ...d, buttonClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='panelClass'>
            <MyTextarea value={draft.panelClass} onChange={e => setDraft(d => ({ ...d, panelClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='closeButtonClass'>
            <MyTextarea value={draft.closeButtonClass} onChange={e => setDraft(d => ({ ...d, closeButtonClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <div className='relative'>
          <MyHelp
            label={applied.label}
            title={applied.title}
            text={applied.mode === 'text' ? applied.text : undefined}
            items={applied.mode === 'items' ? parseHelpItems(applied.itemsText) : undefined}
            buttonClass={applied.buttonClass}
            panelClass={applied.panelClass}
            closeButtonClass={applied.closeButtonClass}
          />
          <span className='ml-2 text-xs text-gray-500'>click to toggle</span>
        </div>
      }
      returns={
        <>
          <ReturnRow label='label' value={applied.label} />
          <ReturnRow label='title' value={applied.title} />
          <ReturnRow label='mode' value={applied.mode} />
          <ReturnRow
            label='items'
            value={applied.mode === 'items' ? JSON.stringify(parseHelpItems(applied.itemsText)) : '(unused)'}
          />
        </>
      }
    />
  )
}

type HelpFieldControlProps = { text: string; className: string; triggerClass: string; tooltipClass: string }
const helpFieldDefaults: HelpFieldControlProps = {
  text: 'Tooltip help text shown on hover.',
  className: '',
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
          <ControlRow label='className (wrapper)'>
            <MyTextarea value={draft.className} onChange={e => setDraft(d => ({ ...d, className: e.target.value }))} overrideClass='w-full h-16' />
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
          <MyHelpField text={applied.text} className={applied.className} triggerClass={applied.triggerClass} tooltipClass={applied.tooltipClass} />
        </div>
      }
      returns={
        <>
          <ReturnRow label='text' value={applied.text} />
          <ReturnRow label='className' value={applied.className || '(none)'} />
        </>
      }
    />
  )
}

type HelpStepControlProps = {
  title: string
  input: string
  processing: string
  output: string
  consumers: string
  label: string
  buttonClass: string
  panelClass: string
  closeButtonClass: string
}
const helpStepDefaults: HelpStepControlProps = {
  title: 'Process name',
  input: 'Input A,Input B',
  processing: 'Describe what happens here.',
  output: 'Output A,Output B',
  consumers: '',
  label: 'Help',
  buttonClass: 'text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1.5 py-0.5 leading-none',
  panelClass: 'absolute z-20 mt-1 p-4 bg-blue-50 border border-blue-200 rounded-md shadow-xl text-xs max-w-xl',
  closeButtonClass: MyHelpStep_closeButtonDftClass,
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
          <ControlRow label='closeButtonClass'>
            <MyTextarea value={draft.closeButtonClass} onChange={e => setDraft(d => ({ ...d, closeButtonClass: e.target.value }))} overrideClass='w-full h-16' />
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
            closeButtonClass={applied.closeButtonClass}
          />
          <span className='ml-2 text-xs text-gray-500'>click to toggle</span>
        </div>
      }
      returns={
        <>
          <ReturnRow label='title' value={applied.title} />
          <ReturnRow label='input' value={parseList(applied.input).join(', ')} />
          <ReturnRow label='processing' value={applied.processing} />
          <ReturnRow label='output' value={parseList(applied.output).join(', ')} />
          <ReturnRow label='consumers' value={parseList(applied.consumers).length > 0 ? parseList(applied.consumers).join(', ') : '(none)'} />
        </>
      }
    />
  )
}

type TabControlProps = {
  label: string
  variant: 'underline' | 'pill'
  underlineActiveClass: string
  underlineInactiveClass: string
  pillActiveClass: string
  pillInactiveClass: string
  overrideClass: string
  restProps: string
}
const tabDefaults: TabControlProps = {
  label: 'Tab A',
  variant: 'underline',
  underlineActiveClass: MyTab_underlineActiveClass,
  underlineInactiveClass: MyTab_underlineInactiveClass,
  pillActiveClass: MyTab_pillActiveClass,
  pillInactiveClass: MyTab_pillInactiveClass,
  overrideClass: '',
  restProps: '',
}

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
    ? (active ? applied.pillActiveClass : applied.pillInactiveClass)
    : (active ? applied.underlineActiveClass : applied.underlineInactiveClass)
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
          <ControlRow label='underlineActiveClass'>
            <MyTextarea value={draft.underlineActiveClass} onChange={e => setDraft(d => ({ ...d, underlineActiveClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='underlineInactiveClass'>
            <MyTextarea value={draft.underlineInactiveClass} onChange={e => setDraft(d => ({ ...d, underlineInactiveClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='pillActiveClass'>
            <MyTextarea value={draft.pillActiveClass} onChange={e => setDraft(d => ({ ...d, pillActiveClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='pillInactiveClass'>
            <MyTextarea value={draft.pillInactiveClass} onChange={e => setDraft(d => ({ ...d, pillInactiveClass: e.target.value }))} overrideClass='w-full h-16' />
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
            underlineActiveClass={applied.underlineActiveClass}
            underlineInactiveClass={applied.underlineInactiveClass}
            pillActiveClass={applied.pillActiveClass}
            pillInactiveClass={applied.pillInactiveClass}
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

//
//  Static option sets for MySelectMulti — 6 fruits and 20 fruits, so the demo panel's
//  max-height/scroll behavior can be exercised with both a short and a long list
//
const selectMultiFruitOptions6 = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig']
const selectMultiFruitOptions20 = [
  'Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew', 'Kiwi', 'Lemon',
  'Mango', 'Nectarine', 'Orange', 'Papaya', 'Quince', 'Raspberry', 'Strawberry', 'Tangerine',
  'Ugli Fruit', 'Watermelon',
]

type SelectMultiControlProps = {
  //
  //  Data / behavior
  //
  label: string
  optionSet: '6 fruits' | '20 fruits'
  id: string
  selectAllLabel: string
  minSelected: string
  maxSelected: string
  //
  //  Style
  //
  defaultClass: string
  overrideClass: string
  labelClass: string
  containerClass: string
  panelClass: string
  mergePanelWidthClass: string
  mergePanelMaxHeightClass: string
  mergeRowClass: string
  mergeSelectAllRowClass: string
  mergeCheckboxClass: string
}
const selectMultiDefaults: SelectMultiControlProps = {
  label: 'Fruits',
  optionSet: '6 fruits',
  id: '',
  selectAllLabel: 'All',
  minSelected: '',
  maxSelected: '',
  defaultClass: MySelectMulti_dftClass,
  overrideClass: '',
  labelClass: MySelectMulti_labelDftClass,
  containerClass: MySelectMulti_containerDftClass,
  panelClass: MySelectMulti_panelDftClass,
  mergePanelWidthClass: '',
  mergePanelMaxHeightClass: '',
  mergeRowClass: '',
  mergeSelectAllRowClass: '',
  mergeCheckboxClass: '',
}

//----------------------------------------------------------------------------------------------
//  MySelectMultiTab
//----------------------------------------------------------------------------------------------
function MySelectMultiTab() {
  const [draft, setDraft] = useState<SelectMultiControlProps>(selectMultiDefaults)
  const [applied, setApplied] = useState<SelectMultiControlProps>(selectMultiDefaults)
  const [selected, setSelected] = useState<string[]>([])

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
    setSelected([])
  }

  const computedClass = myMergeClasses(applied.defaultClass, applied.overrideClass)
  const appliedOptions = applied.optionSet === '20 fruits' ? selectMultiFruitOptions20 : selectMultiFruitOptions6
  const computedPanelClass = myMergeClasses(
    myMergeClasses(applied.panelClass, applied.mergePanelWidthClass !== '' ? applied.mergePanelWidthClass : MySelectMulti_panelWidthDftClass),
    applied.mergePanelMaxHeightClass !== '' ? applied.mergePanelMaxHeightClass : MySelectMulti_panelMaxHeightDftClass
  )
  const computedRowClass = myMergeClasses(MySelectMulti_rowDftClass, applied.mergeRowClass)
  const computedSelectAllRowClass = myMergeClasses(MySelectMulti_selectAllRowDftClass, applied.mergeSelectAllRowClass)
  const computedCheckboxClass = myMergeClasses(MySelectMulti_checkboxDftClass, applied.mergeCheckboxClass)

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='label'>
            <MyInput value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='optionSet'>
            <MySelect
              options={['6 fruits', '20 fruits']}
              value={draft.optionSet}
              onChange={e => setDraft(d => ({ ...d, optionSet: e.target.value as '6 fruits' | '20 fruits' }))}
            />
          </ControlRow>
          <ControlRow label='id'>
            <MyInput value={draft.id} onChange={e => setDraft(d => ({ ...d, id: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='selectAllLabel'>
            <MyInput value={draft.selectAllLabel} onChange={e => setDraft(d => ({ ...d, selectAllLabel: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='minSelected'>
            <MyInput type='number' value={draft.minSelected} onChange={e => setDraft(d => ({ ...d, minSelected: e.target.value }))} overrideClass='w-20' />
          </ControlRow>
          <ControlRow label='maxSelected'>
            <MyInput type='number' value={draft.maxSelected} onChange={e => setDraft(d => ({ ...d, maxSelected: e.target.value }))} overrideClass='w-20' />
          </ControlRow>
          <ControlRow label='defaultClass'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea
              value={draft.overrideClass}
              onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))}
              overrideClass='w-full h-48'
            />
          </ControlRow>
          <ControlRow label='labelClass'>
            <MyTextarea value={draft.labelClass} onChange={e => setDraft(d => ({ ...d, labelClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='containerClass'>
            <MyTextarea value={draft.containerClass} onChange={e => setDraft(d => ({ ...d, containerClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='panelClass'>
            <MyTextarea value={draft.panelClass} onChange={e => setDraft(d => ({ ...d, panelClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='mergePanelWidthClass'>
            <MyInput value={draft.mergePanelWidthClass} onChange={e => setDraft(d => ({ ...d, mergePanelWidthClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='mergePanelMaxHeightClass'>
            <MyInput value={draft.mergePanelMaxHeightClass} onChange={e => setDraft(d => ({ ...d, mergePanelMaxHeightClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='mergeRowClass'>
            <MyInput value={draft.mergeRowClass} onChange={e => setDraft(d => ({ ...d, mergeRowClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='mergeSelectAllRowClass'>
            <MyInput value={draft.mergeSelectAllRowClass} onChange={e => setDraft(d => ({ ...d, mergeSelectAllRowClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='mergeCheckboxClass'>
            <MyInput value={draft.mergeCheckboxClass} onChange={e => setDraft(d => ({ ...d, mergeCheckboxClass: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MySelectMulti
          label={applied.label}
          options={appliedOptions}
          selected={selected}
          onChange={setSelected}
          id={applied.id || undefined}
          selectAllLabel={applied.selectAllLabel}
          minSelected={applied.minSelected !== '' ? Number(applied.minSelected) : undefined}
          maxSelected={applied.maxSelected !== '' ? Number(applied.maxSelected) : undefined}
          defaultClass={applied.defaultClass}
          overrideClass={applied.overrideClass}
          labelClass={applied.labelClass}
          containerClass={applied.containerClass}
          panelClass={applied.panelClass}
          mergePanelWidthClass={applied.mergePanelWidthClass !== '' ? applied.mergePanelWidthClass : undefined}
          mergePanelMaxHeightClass={applied.mergePanelMaxHeightClass !== '' ? applied.mergePanelMaxHeightClass : undefined}
          mergeRowClass={applied.mergeRowClass}
          mergeSelectAllRowClass={applied.mergeSelectAllRowClass}
          mergeCheckboxClass={applied.mergeCheckboxClass}
        />
      }
      returns={
        <>
          <ReturnRow label='count' value={String(selected.length)} />
          <ReturnRow label='selected' value={selected.length > 0 ? selected.join(', ') : '(none)'} />
          <ReturnRow label='id (auto)' value={applied.id || applied.label.toLowerCase().replace(/\s+/g, '-')} />
          <ReturnRow label='className' value={computedClass} />
          <ReturnRow label='labelClass' value={applied.labelClass} />
          <ReturnRow label='containerClass' value={applied.containerClass} />
          <ReturnRow label='panelClassName' value={computedPanelClass} />
          <ReturnRow label='rowClass' value={computedRowClass} />
          <ReturnRow label='selectAllRowClass' value={computedSelectAllRowClass} />
          <ReturnRow label='checkboxClass' value={computedCheckboxClass} />
          <ReturnRow label='isSelectionFiltering' value={String(isSelectionFiltering(selected, appliedOptions.length))} />
          <ReturnRow label='serializeSelection' value={JSON.stringify(serializeSelection(selected, appliedOptions.length))} />
        </>
      }
    />
  )
}

type SelectRowsControlProps = {
  label: string
  options: string
  id: string
  defaultClass: string
  overrideClass: string
  labelClass: string
  containerClass: string
}
const selectRowsDefaults: SelectRowsControlProps = {
  label: 'Rows',
  options: '10,20,50,100',
  id: '',
  defaultClass: MySelectRows_dftClass,
  overrideClass: '',
  labelClass: MySelect_labelDftClass,
  containerClass: MySelect_containerDftClass,
}

//----------------------------------------------------------------------------------------------
//  MySelectRowsTab
//----------------------------------------------------------------------------------------------
function MySelectRowsTab() {
  const [draft, setDraft] = useState<SelectRowsControlProps>(selectRowsDefaults)
  const [applied, setApplied] = useState<SelectRowsControlProps>(selectRowsDefaults)
  const [value, setValue] = useState(20)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  const parsedOptions = parseNumberList(applied.options)
  const computedClass = myMergeClasses(applied.defaultClass, applied.overrideClass)

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
          <ControlRow label='id'>
            <MyInput value={draft.id} onChange={e => setDraft(d => ({ ...d, id: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='defaultClass'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea value={draft.overrideClass} onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))} overrideClass='w-full h-48' />
          </ControlRow>
          <ControlRow label='labelClass'>
            <MyTextarea value={draft.labelClass} onChange={e => setDraft(d => ({ ...d, labelClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='containerClass'>
            <MyTextarea value={draft.containerClass} onChange={e => setDraft(d => ({ ...d, containerClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MySelectRows
          label={applied.label}
          options={parsedOptions}
          value={value}
          onChange={setValue}
          id={applied.id || undefined}
          defaultClass={applied.defaultClass}
          overrideClass={applied.overrideClass}
          labelClass={applied.labelClass}
          containerClass={applied.containerClass}
        />
      }
      returns={
        <>
          <ReturnRow label='value' value={String(value)} />
          <ReturnRow label='options' value={parsedOptions.join(', ') || '(none)'} />
          <ReturnRow label='id (auto)' value={applied.id || applied.label.toLowerCase().replace(/\s+/g, '-')} />
          <ReturnRow label='className' value={computedClass} />
          <ReturnRow label='labelClass' value={applied.labelClass} />
          <ReturnRow label='containerClass' value={applied.containerClass} />
        </>
      }
    />
  )
}

type PaginationFooterControlProps = {
  totalPages: string
  rowsOptions: string
  totalRows: string
  defaultClass: string
  overrideClass: string
  paginationOverrideClass: string
  selectRowsOverrideClass: string
  totalRowsClass: string
}
const paginationFooterDefaults: PaginationFooterControlProps = {
  totalPages: '10',
  rowsOptions: '10,20,50,100',
  totalRows: '',
  defaultClass: MyPaginationFooter_dftClass,
  overrideClass: '',
  paginationOverrideClass: '',
  selectRowsOverrideClass: '',
  totalRowsClass: MyPaginationFooter_totalRowsClass,
}

//----------------------------------------------------------------------------------------------
//  MyPaginationFooterTab
//----------------------------------------------------------------------------------------------
function MyPaginationFooterTab() {
  const [draft, setDraft] = useState<PaginationFooterControlProps>(paginationFooterDefaults)
  const [applied, setApplied] = useState<PaginationFooterControlProps>(paginationFooterDefaults)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
    setCurrentPage(1)
  }

  const parsedRowsOptions = parseNumberList(applied.rowsOptions)
  const computedClass = myMergeClasses(applied.defaultClass, applied.overrideClass)
  const displayRows = applied.totalRows !== '' ? Number(applied.totalRows) : (applied.totalPages !== '' ? Number(applied.totalPages) : 1) * rowsPerPage

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
          <ControlRow label='rowsOptions (comma-sep)'>
            <MyInput value={draft.rowsOptions} onChange={e => setDraft(d => ({ ...d, rowsOptions: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='totalRows'>
            <MyInput type='number' value={draft.totalRows} onChange={e => setDraft(d => ({ ...d, totalRows: e.target.value }))} overrideClass='w-20' />
          </ControlRow>
          <ControlRow label='defaultClass'>
            <MyTextarea value={draft.defaultClass} onChange={e => setDraft(d => ({ ...d, defaultClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='overrideClass'>
            <MyTextarea
              value={draft.overrideClass}
              onChange={e => setDraft(d => ({ ...d, overrideClass: e.target.value }))}
              overrideClass='w-full h-48'
            />
          </ControlRow>
          <ControlRow label='paginationOverrideClass'>
            <MyTextarea value={draft.paginationOverrideClass} onChange={e => setDraft(d => ({ ...d, paginationOverrideClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='selectRowsOverrideClass'>
            <MyTextarea value={draft.selectRowsOverrideClass} onChange={e => setDraft(d => ({ ...d, selectRowsOverrideClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='totalRowsClass'>
            <MyTextarea value={draft.totalRowsClass} onChange={e => setDraft(d => ({ ...d, totalRowsClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyPaginationFooter
          totalPages={applied.totalPages !== '' ? Number(applied.totalPages) : 1}
          statecurrentPage={currentPage}
          setStateCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          rowsOptions={parsedRowsOptions}
          totalRows={applied.totalRows !== '' ? Number(applied.totalRows) : undefined}
          defaultClass={applied.defaultClass}
          overrideClass={applied.overrideClass}
          paginationOverrideClass={applied.paginationOverrideClass}
          selectRowsOverrideClass={applied.selectRowsOverrideClass}
          totalRowsClass={applied.totalRowsClass}
        />
      }
      returns={
        <>
          <ReturnRow label='currentPage' value={String(currentPage)} />
          <ReturnRow label='rowsPerPage' value={String(rowsPerPage)} />
          <ReturnRow label='displayRows' value={String(displayRows)} />
          <ReturnRow label='className' value={computedClass} />
          <ReturnRow label='totalRowsClass' value={applied.totalRowsClass} />
        </>
      }
    />
  )
}

type BackHomeNavControlProps = { backPath: string; backLabel: string; homePath: string; containerClass: string; linkClass: string }
const backHomeNavDefaults: BackHomeNavControlProps = {
  backPath: '/owner?tab=Components',
  backLabel: 'Back',
  homePath: '/owner',
  containerClass: MyBackHomeNav_containerDftClass,
  linkClass: MyBackHomeNav_linkDftClass,
}

//----------------------------------------------------------------------------------------------
//  MyBackHomeNavTab
//----------------------------------------------------------------------------------------------
function MyBackHomeNavTab() {
  const [draft, setDraft] = useState<BackHomeNavControlProps>(backHomeNavDefaults)
  const [applied, setApplied] = useState<BackHomeNavControlProps>(backHomeNavDefaults)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...draft })
  }

  return (
    <ThreeSection
      controls={
        <form onSubmit={handleApply} className='flex flex-col gap-2'>
          <ControlRow label='backPath'>
            <MyInput value={draft.backPath} onChange={e => setDraft(d => ({ ...d, backPath: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='backLabel'>
            <MyInput value={draft.backLabel} onChange={e => setDraft(d => ({ ...d, backLabel: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='homePath'>
            <MyInput value={draft.homePath} onChange={e => setDraft(d => ({ ...d, homePath: e.target.value }))} overrideClass='w-full' />
          </ControlRow>
          <ControlRow label='containerClass'>
            <MyTextarea value={draft.containerClass} onChange={e => setDraft(d => ({ ...d, containerClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <ControlRow label='linkClass'>
            <MyTextarea value={draft.linkClass} onChange={e => setDraft(d => ({ ...d, linkClass: e.target.value }))} overrideClass='w-full h-16' />
          </ControlRow>
          <div className='mt-3'>
            <MyButton type='submit'>Apply</MyButton>
          </div>
        </form>
      }
      preview={
        <MyBackHomeNav
          backPath={applied.backPath || null}
          backLabel={applied.backLabel}
          homePath={applied.homePath}
          containerClass={applied.containerClass}
          linkClass={applied.linkClass}
        />
      }
      returns={
        <>
          <ReturnRow label='backPath' value={applied.backPath || '(none)'} />
          <ReturnRow label='backLabel' value={applied.backLabel || '(default: Back)'} />
          <ReturnRow label='homePath' value={applied.homePath} />
          <ReturnRow
            label='backLinkShown'
            value={String(Boolean(applied.backPath) && applied.backPath !== applied.homePath)}
          />
        </>
      }
    />
  )
}
