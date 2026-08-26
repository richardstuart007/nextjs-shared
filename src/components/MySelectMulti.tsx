'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MySelectMulti — compact checkbox-dropdown multi-select
//
//    Parameters:
//      label, options, selected, onChange, id — standard multi-select data/behavior: options
//        are string values or {value,label} pairs; selected holds the current values; onChange
//        fires with the full new selection
//      selectAllLabel           — trigger text when nothing/everything is selected, and the
//                                 "select all" row label; defaults to 'All'
//      minSelected, maxSelected — optional selection-count bounds; toggling that would violate
//                                 a bound is ignored (or, when min === max, rotates the oldest
//                                 selection out)
//      defaultClass, overrideClass, labelClass, containerClass, panelClass,
//      mergePanelWidthClass, mergePanelMaxHeightClass, mergeRowClass,
//      mergeSelectAllRowClass, mergeCheckboxClass — style overrides for each sub-element,
//        merged over their MySelectMulti_*DftClass defaults
//
//  2) NOTES
//    Selection convention: every option selected, or none, = no filter. The trigger label
//    shows selectAllLabel (default 'All') when every option is selected OR when selected is
//    empty; otherwise `${selected.length} selected` (or `${selected.length}/${maxSelected}
//    selected` if maxSelected is set). See isSelectionFiltering.ts for the shared helper that
//    treats both extremes as "no filter" when a caller needs to decide whether to apply this
//    selection to a query — never re-derive that with an ad hoc .length check.
//
//    The "select all" checkbox row renders first inside the open panel; checking it sets
//    `selected` to every option's value in one action. While everything is selected,
//    individual per-option checkboxes render UNCHECKED (only the "select all" row's own
//    checkbox shows ticked), so the "all selected" state isn't visually indistinguishable from
//    every item being individually ticked — and clicking an individual checkbox in that state
//    narrows the selection to just that one item (not "all minus one"). When selected is
//    empty, the "select all" row's own checkbox also stays unchecked — only the trigger label
//    changes.
//
//    Floating selections: whenever an item is checked, it floats to the top of the open panel
//    (above a divider, MySelectMulti_selectedDividerClass); unchecking it sinks it back to its
//    original position. Both groups preserve their original relative `options` order (a stable
//    partition, not sorted by selection recency) — no animation, items snap to their new
//    position instantly. Not opt-in — this is every MySelectMulti's default panel ordering.
//
//    minSelected/maxSelected are hard floors/ceilings enforced by the component itself —
//    clicking past either is a silent no-op (the checkbox stays interactive, it just doesn't
//    change anything; there's no disabled/greyed-out visual state), EXCEPT: when minSelected
//    === maxSelected (a fixed-count picker), checking a new item past maxSelected instead
//    swaps — the oldest-picked item (selected[0], insertion order, since toggle() appends new
//    picks to the end) is dropped and the new item appended, keeping the count exactly at the
//    cap. Note "oldest" is insertion order, not necessarily the item currently shown at the top
//    of the floated group (floating order follows the original `options` position, an
//    independent ordering) — the two can differ, and that's expected. When maxSelected is set
//    below options.length, "every option selected" becomes impossible by definition, so the
//    "select all" row isn't rendered and the trigger label never shows selectAllLabel for the
//    full-selection case — it always falls back to the `${selected.length}/${maxSelected}
//    selected` count. Whenever minSelected and/or maxSelected is set, the trigger button gets a
//    `title` hover tooltip describing the constraint ("Select 2", "Select 2-4", "Select at
//    least 2", "Select up to 4").
//
//    Naming convention: a `merge` prefix means the prop is merged via myMergeClasses against a
//    fixed default, never a full replacement — mirroring the pre-existing
//    overrideClass/defaultClass pair (overrideClass itself keeps its original name; renaming it
//    would be a package-wide breaking change, not done here — `merge` is the convention for
//    props added going forward instead). mergePanelWidthClass/mergePanelMaxHeightClass are kept
//    separate from panelClass so a caller needing a different width or height only overrides
//    that one piece (w- and max-h- are recognized groups in myMergeClasses). The wrapper
//    `<div className='relative'>` around the trigger/panel is intentionally excluded from the
//    merge-prop pattern — it's a structural positioning requirement for the panel's `absolute`
//    positioning, not a stylistic choice.
//
//    Panel width defaults to the trigger button's rendered width, not its content — the
//    trigger and panel are siblings inside a `relative` wrapper that's a flex item of
//    containerClass, so the wrapper already shrink-wraps to the trigger's width, and
//    mergePanelWidthClass's default ('w-full') inherits that same width. Option rows are
//    whitespace-nowrap and not wrapped automatically — a label wider than the panel is
//    silently clipped on the right (no scrollbar, overflow-x-hidden); widen the trigger
//    (overrideClass) or the panel (mergePanelWidthClass) if that shows up in testing.
//==============================================================================================

import { useState, useRef, useEffect } from 'react'
import { myMergeClasses } from './MyMergeClasses'
import {
  MySelectMulti_dftClass,
  MySelectMulti_labelDftClass,
  MySelectMulti_containerDftClass,
  MySelectMulti_panelDftClass,
  MySelectMulti_panelWidthDftClass,
  MySelectMulti_panelMaxHeightDftClass,
  MySelectMulti_rowDftClass,
  MySelectMulti_selectAllRowDftClass,
  MySelectMulti_checkboxDftClass,
  MySelectMulti_selectedDividerClass
} from '../constants'

type Option = string | { value: string; label: string }

type Props = {
  //
  //  Data / behavior
  //
  label?: string
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  id?: string
  selectAllLabel?: string
  minSelected?: number
  maxSelected?: number
  //
  //  Style
  //
  defaultClass?: string
  overrideClass?: string
  labelClass?: string
  containerClass?: string
  panelClass?: string
  mergePanelWidthClass?: string
  mergePanelMaxHeightClass?: string
  mergeRowClass?: string
  mergeSelectAllRowClass?: string
  mergeCheckboxClass?: string
}

export default function MySelectMulti({
  //
  //  Data / behavior
  //
  label,
  options,
  selected,
  onChange,
  id,
  selectAllLabel = 'All',
  minSelected,
  maxSelected,
  //
  //  Style
  //
  defaultClass = MySelectMulti_dftClass,
  overrideClass = '',
  labelClass = MySelectMulti_labelDftClass,
  containerClass = MySelectMulti_containerDftClass,
  panelClass = MySelectMulti_panelDftClass,
  mergePanelWidthClass = MySelectMulti_panelWidthDftClass,
  mergePanelMaxHeightClass = MySelectMulti_panelMaxHeightDftClass,
  mergeRowClass = '',
  mergeSelectAllRowClass = '',
  mergeCheckboxClass = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const normalized = options.map(normalize)
  const autoId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const className = myMergeClasses(defaultClass, overrideClass)
  const panelClassName = myMergeClasses(myMergeClasses(panelClass, mergePanelWidthClass), mergePanelMaxHeightClass)
  const rowClassName = myMergeClasses(MySelectMulti_rowDftClass, mergeRowClass)
  const selectAllRowClassName = myMergeClasses(MySelectMulti_selectAllRowDftClass, mergeSelectAllRowClass)
  const checkboxClassName = myMergeClasses(MySelectMulti_checkboxDftClass, mergeCheckboxClass)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const allSelected = selected.length === normalized.length
  const canSelectAll = maxSelected === undefined || maxSelected >= normalized.length

  const countLabel = maxSelected !== undefined ? `${selected.length}/${maxSelected} selected` : `${selected.length} selected`
  const display = allSelected || selected.length === 0 ? selectAllLabel : countLabel
  let constraintTitle: string | undefined
  if (minSelected !== undefined && maxSelected !== undefined) {
    constraintTitle = minSelected === maxSelected ? `Select ${minSelected}` : `Select ${minSelected}-${maxSelected}`
  } else if (minSelected !== undefined) {
    constraintTitle = `Select at least ${minSelected}`
  } else if (maxSelected !== undefined) {
    constraintTitle = `Select up to ${maxSelected}`
  }
  const selectedItems = normalized.filter(opt => selected.includes(opt.value))
  const unselectedItems = normalized.filter(opt => !selected.includes(opt.value))

  return (
    <div className={containerClass}>
      {label && <label htmlFor={autoId} className={labelClass}>{label}</label>}
      <div ref={ref} className='relative'>
        <button
          id={autoId}
          type='button'
          aria-haspopup='listbox'
          aria-expanded={open}
          title={constraintTitle}
          onClick={() => setOpen(o => !o)}
          className={className}
        >
          {display}
        </button>
        {open && (
          <div role='listbox' aria-multiselectable='true' className={panelClassName}>
            {canSelectAll && (
              <label className={selectAllRowClassName}>
                <input
                  type='checkbox'
                  checked={allSelected}
                  onChange={selectAll}
                  className={checkboxClassName}
                />
                {selectAllLabel}
              </label>
            )}
            {selectedItems.map(opt => (
              <label key={opt.value} className={rowClassName}>
                <input
                  type='checkbox'
                  checked={allSelected ? false : selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className={checkboxClassName}
                />
                {opt.label}
              </label>
            ))}
            {selectedItems.length > 0 && unselectedItems.length > 0 && (
              <div className={MySelectMulti_selectedDividerClass} />
            )}
            {unselectedItems.map(opt => (
              <label key={opt.value} className={rowClassName}>
                <input
                  type='checkbox'
                  checked={allSelected ? false : selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className={checkboxClassName}
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  //----------------------------------------------------------------------------------------------
  //  selectAll — selects every option, unless maxSelected is below the option count
  //----------------------------------------------------------------------------------------------
  function selectAll() {
    if (!canSelectAll) return
    onChange(normalized.map(opt => opt.value))
  }

  //----------------------------------------------------------------------------------------------
  //  toggle — flips one option's selected state, respecting minSelected/maxSelected.
  //  Toggling off the last item while "all" is showing collapses to just that one item
  //  (since allSelected renders every checkbox as unchecked); a toggle-on that would
  //  exceed maxSelected is ignored, unless minSelected === maxSelected, in which case
  //  the oldest selection rotates out to make room for the new one
  //
  //  Params:
  //    value — the option value being toggled
  //----------------------------------------------------------------------------------------------
  function toggle(value: string) {
    const isSelected = selected.includes(value)

    if (isSelected) {
      if (allSelected) {
        const candidate = [value]
        if (minSelected !== undefined && candidate.length < minSelected) return
        onChange(candidate)
        return
      }
      const candidate = selected.filter(v => v !== value)
      if (minSelected !== undefined && candidate.length < minSelected) return
      onChange(candidate)
      return
    }

    if (maxSelected !== undefined && selected.length + 1 > maxSelected) {
      if (minSelected !== undefined && minSelected === maxSelected) {
        onChange([...selected.slice(1), value])
      }
      return
    }
    onChange([...selected, value])
  }
}

//----------------------------------------------------------------------------------
//  normalize — expands a plain string option to {value,label} (label === value);
//  {value,label} pairs pass through unchanged
//
//  Params:
//    opt — a raw Option (string or {value,label})
//
//  Returns:
//    the normalized {value,label} pair
//----------------------------------------------------------------------------------
function normalize(opt: Option): { value: string; label: string } {
  return typeof opt === 'string' ? { value: opt, label: opt } : opt
}
