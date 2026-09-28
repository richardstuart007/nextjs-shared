'use client';

//==============================================================================================
//  1) DESCRIPTION
//    MyHelpStep — toggleable step help panel showing input/processing/output/consumers
//
//    Parameters:
//      title                — step name shown in the panel heading
//      input                — input line(s)
//      processing           — processing description
//      output               — output line(s)
//      consumers            — optional consumer line(s); the Consumers row is omitted when
//                             absent
//      label                — trigger button label; defaults to 'Help'
//      showCloseButton      — shows the "×" close button in the panel header; defaults to true
//      closeOnOutsideClick  — closes the panel on an outside click; defaults to true
//      buttonClass          — trigger button classes; defaults to MyHelpStep_buttonDftClass
//      panelClass           — popover panel classes; defaults to MyHelpStep_panelDftClass
//      closeButtonClass     — popover close button classes; defaults to
//                             MyHelpStep_closeButtonDftClass
//      labelColumnClass     — width class applied to the Input row's label cell, which
//                             sets the table's label-column width for every row; defaults
//                             to MyHelpStep_labelColumnDftClass
//
//  2) NOTES
//    See MyHelp.tsx's header for how showCloseButton/closeOnOutsideClick interact with the
//    trigger button's own always-on toggle — same behavior here.
//
//  3) CHANGE HISTORY
//    2026-08-25 — added showCloseButton/closeOnOutsideClick props (both default true,
//                 preserving the prior unconditional behavior for every existing caller)
//==============================================================================================

import { useState, useRef, useEffect } from 'react';
import {
  MyHelpStep_buttonDftClass,
  MyHelpStep_panelDftClass,
  MyHelpStep_closeButtonDftClass,
  MyHelpStep_labelColumnDftClass,
} from '../constants';

export type MyHelpStepProps = {
  title: string;
  input: string[];
  processing: string;
  output: string[];
  consumers?: string[];
  label?: string;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  buttonClass?: string;
  panelClass?: string;
  closeButtonClass?: string;
  labelColumnClass?: string;
};

export function MyHelpStep({
  title,
  input,
  processing,
  output,
  consumers,
  label = 'Help',
  showCloseButton = true,
  closeOnOutsideClick = true,
  buttonClass = MyHelpStep_buttonDftClass,
  panelClass = MyHelpStep_panelDftClass,
  closeButtonClass = MyHelpStep_closeButtonDftClass,
  labelColumnClass = MyHelpStep_labelColumnDftClass,
}: MyHelpStepProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!closeOnOutsideClick) return;
    //----------------------------------------------------------------------------------------------
    //  onClickOutside — closes the help panel when a mousedown lands outside the component
    //
    //  Params:
    //    e — the document mousedown event
    //----------------------------------------------------------------------------------------------
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [closeOnOutsideClick]);

  const inputLabelClass = `font-semibold text-gray-500 ${labelColumnClass} px-3 py-2 border-b border-gray-100 whitespace-nowrap`;
  const outputLabelClass = `font-semibold text-gray-500 px-3 py-2 whitespace-nowrap ${consumers ? 'border-b border-gray-100' : ''}`;
  const outputValueClass = `text-gray-700 px-3 py-2 ${consumers ? 'border-b border-gray-100' : ''}`;

  return (
    <span ref={ref} className="inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={buttonClass}
        type="button"
      >
        {label}
      </button>

      {open && (
        <div className={panelClass}>
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold text-blue-800 text-sm">{title}</p>
            {showCloseButton && (
              <button
                onClick={() => setOpen(false)}
                className={closeButtonClass}
                type="button"
              >
                ×
              </button>
            )}
          </div>

          <div className="bg-white border border-blue-100 rounded">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="align-top">
                  <td className={inputLabelClass}>
                    Input
                  </td>
                  <td className="text-gray-700 px-3 py-2 border-b border-gray-100">
                    {input.map((s, i) => {
                      const itemClass = i > 0 ? 'mt-0.5' : '';
                      return (
                        <div key={i} className={itemClass}>
                          {s}
                        </div>
                      );
                    })}
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="font-semibold text-gray-500 px-3 py-2 border-b border-gray-100 whitespace-nowrap">
                    Processing
                  </td>
                  <td className="text-gray-700 px-3 py-2 border-b border-gray-100">
                    {processing}
                  </td>
                </tr>
                <tr className="align-top">
                  <td
                    className={outputLabelClass}
                  >
                    Output
                  </td>
                  <td
                    className={outputValueClass}
                  >
                    {output.map((s, i) => {
                      const itemClass = i > 0 ? 'mt-0.5' : '';
                      return (
                        <div key={i} className={itemClass}>
                          {s}
                        </div>
                      );
                    })}
                  </td>
                </tr>
                {consumers && (
                  <tr className="align-top">
                    <td className="font-semibold text-gray-500 px-3 py-2 whitespace-nowrap">
                      Consumers
                    </td>
                    <td className="text-gray-700 px-3 py-2">
                      {consumers.map((s, i) => {
                        const itemClass = i > 0 ? 'mt-0.5' : '';
                        return (
                          <div key={i} className={itemClass}>
                            {s}
                          </div>
                        );
                      })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </span>
  );
}
