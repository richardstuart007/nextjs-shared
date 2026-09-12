'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyInputNumeric — numeric input with min/max, decimals/integerOnly filtering, fixed-decimal
//    formatting on blur, and hidden spin arrows
//
//    Parameters:
//      value          — current numeric value, or '' when the field is empty
//      onChange       — called with the parsed number, or null when the field is empty
//      min            — optional minimum; violating it shows errorClass but does not clamp/block,
//                       unless clampOnBlur is set
//      max            — optional maximum; violating it shows errorClass but does not clamp/block,
//                       unless clampOnBlur is set
//      decimals       — optional cap on digits allowed after the decimal point; also the number of
//                       digits the displayed value is padded/formatted to once the field is blurred
//                       (e.g. 47 → "47.00"); 0 rejects the decimal point keystroke entirely (same
//                       as integerOnly); omitted = unlimited decimals, no blur formatting
//      integerOnly    — rejects the decimal point keystroke entirely; same effect as decimals=0
//      clampOnBlur    — when true, a value outside [min, max] is corrected to the nearest bound on
//                       blur (via onChange) instead of being left in place with errorClass styling;
//                       defaults to false. Has no effect unless min and/or max is also set.
//      overrideClass  — caller classes merged over MyInputNumeric_dftClass via myMergeClasses
//      errorClass     — classes appended when value is outside min/max; defaults to
//                       MyInputNumeric_errorDftClass
//      ...rest        — all other standard <input> attributes, passed through
//
//  2) NOTES
//    decimals===0 and integerOnly===true both route through the same "reject the '.' keystroke"
//    path rather than a generic "cap digits after the point to N" path — capping to zero digits
//    would still let '.' be typed, leaving a dead-end "3." state that can never be completed.
//    Negative values are not supported at all (no allowNegative prop) — the '-' keystroke is
//    rejected the same way.
//
//    The displayed text is tracked separately from `value` (a plain number, which can't carry a
//    trailing decimal point or trailing zeros — "47." and "47.50" both collapse to the number 47.5
//    once parsed). While focused, the display mirrors exactly what was typed; on blur it's
//    reformatted to `decimals` places. Without this, a controlled `<input>` driven straight from
//    `value` would strip the trailing "." or "0" the user just typed on every keystroke.
//
//    Spin arrows are always hidden — there is no opt-back-in prop.
//
//    clampOnBlur only corrects a value already outside [min, max] on blur — it does not fill in a
//    default when the field is left empty. A caller wanting "empty on blur becomes some default"
//    still handles that themselves via their own onBlur, same as before this prop existed.
//
//  3) CHANGE HISTORY
//    2026-09-12 — added optional clampOnBlur prop: corrects an out-of-range value to the nearest
//                 min/max bound on blur instead of only flagging it via errorClass; defaults to
//                 false, so existing consumers are unaffected
//==============================================================================================

import { useEffect, useState } from 'react'
import { myMergeClasses } from './MyMergeClasses'
import { MyInputNumeric_dftClass, MyInputNumeric_errorDftClass } from '../constants'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | ''
  onChange: (value: number | null) => void
  min?: number
  max?: number
  decimals?: number
  integerOnly?: boolean
  clampOnBlur?: boolean
  overrideClass?: string
  errorClass?: string
}

const hideSpinButtonsClass = [
  '[&::-webkit-outer-spin-button]:appearance-none',
  '[&::-webkit-inner-spin-button]:appearance-none',
  '[-moz-appearance:textfield]',
].join(' ')

export function MyInputNumeric({
  value,
  onChange,
  min,
  max,
  decimals,
  integerOnly = false,
  clampOnBlur = false,
  overrideClass = '',
  errorClass = MyInputNumeric_errorDftClass,
  onKeyDown,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const rejectDecimalPoint = integerOnly || decimals === 0
  const isOutOfRange = value !== '' && ((min !== undefined && value < min) || (max !== undefined && value > max))
  const className =
    myMergeClasses(MyInputNumeric_dftClass, overrideClass) +
    ' ' + hideSpinButtonsClass +
    (isOutOfRange ? ' ' + errorClass : '')

  const [isFocused, setIsFocused] = useState(false)
  const [displayValue, setDisplayValue] = useState(formatValue(value))

  //----------------------------------------------------------------------------------------------
  //  Resync the displayed text from `value` whenever it changes while the field isn't focused —
  //  e.g. the caller resetting/loading a new value programmatically
  //----------------------------------------------------------------------------------------------
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatValue(value))
    }
  }, [value, decimals, isFocused])

  //
  //  Output
  //
  return (
    <input
      {...rest}
      type='number'
      min={min}
      max={max}
      className={className}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      suppressHydrationWarning
    />
  )

  //----------------------------------------------------------------------------------------------
  //  formatValue — '' stays '', otherwise renders to `decimals` places when set, else plain
  //
  //  Params:
  //    v — the value to format
  //
  //  Returns:
  //    the formatted display string
  //----------------------------------------------------------------------------------------------
  function formatValue(v: number | ''): string {
    if (v === '') {
      return ''
    }
    const result = decimals !== undefined ? v.toFixed(decimals) : String(v)
    return result
  }

  //----------------------------------------------------------------------------------------------
  //  handleKeyDown — blocks the '-' key always, and the '.' key when integerOnly/decimals===0
  //
  //  Params:
  //    e — the keydown event; forwarded to the caller's own onKeyDown, if supplied
  //----------------------------------------------------------------------------------------------
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === '-' || (rejectDecimalPoint && e.key === '.')) {
      e.preventDefault()
    }
    onKeyDown?.(e)
  }

  //----------------------------------------------------------------------------------------------
  //  handleFocus — switches the display to raw-typed mode (no blur formatting while editing)
  //
  //  Params:
  //    e — the focus event; forwarded to the caller's own onFocus, if supplied
  //----------------------------------------------------------------------------------------------
  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(true)
    onFocus?.(e)
  }

  //----------------------------------------------------------------------------------------------
  //  handleBlur — reformats the display to `decimals` places (e.g. 47 → "47.00"); when
  //  clampOnBlur is set, first corrects an out-of-range value to the nearest min/max bound
  //
  //  Params:
  //    e — the blur event; forwarded to the caller's own onBlur, if supplied
  //----------------------------------------------------------------------------------------------
  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(false)
    if (clampOnBlur && value !== '' && (min !== undefined || max !== undefined)) {
      let clamped = value
      if (min !== undefined) clamped = Math.max(min, clamped)
      if (max !== undefined) clamped = Math.min(max, clamped)
      if (clamped !== value) {
        onChange(clamped)
        setDisplayValue(formatValue(clamped))
        onBlur?.(e)
        return
      }
    }
    setDisplayValue(formatValue(value))
    onBlur?.(e)
  }

  //----------------------------------------------------------------------------------------------
  //  handleChange — mirrors the raw typed text into displayValue, rejecting negatives and capping
  //  decimal digits to `decimals` when set; parses and emits the numeric value on acceptance
  //
  //  Params:
  //    e — the change event carrying the raw typed text
  //----------------------------------------------------------------------------------------------
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw === '') {
      setDisplayValue('')
      onChange(null)
      return
    }
    if (decimals !== undefined && decimals >= 1) {
      const decimalIndex = raw.indexOf('.')
      if (decimalIndex !== -1 && raw.length - decimalIndex - 1 > decimals) {
        return
      }
    }
    const parsed = Number(raw)
    if (Number.isNaN(parsed) || parsed < 0) {
      return
    }
    setDisplayValue(raw)
    onChange(parsed)
  }
}
