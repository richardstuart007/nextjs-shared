# Plan — nextjs-shared, "version": "2.1.3"

## Current task: Component review and cleanup
- [x] MyPagination — dead code, sizing, generatePagination extracted, sub-components extracted, overrideClass prop
- [x] MyMergeClasses — expand pattern list, function declarations, top-down structure, return const, comments
- [x] MyBox — myMergeClasses, type, defaultTitleClass const, comment header
- [x] MyButton — use client, type, defaultClass const, comment header
- [x] MyCheckbox — use client, comment headers, arrow callbacks, sortFn declaration, return consts

## Outstanding items (component review)
- [ ] MyHourGlass, MyLink, MyLoadingMessage, MyToggle, MyHelp, MyHelpField, MyHelpStep, MyInput, MySelect, MyPopup, MyTextarea

## Outstanding items
- [ ] Review remaining components (MyInput, MyDropdown, MyTextarea, MyConfirmDialog)
- [ ] MyCheckbox default export → named export (deferred: affects consumers)
- [ ] MyBox className → overrideClass rename (deferred: affects consumers)
