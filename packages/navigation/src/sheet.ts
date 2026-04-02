/**
 * Sheet-focused navigation presentation API surface.
 *
 * This entrypoint intentionally exports only modal/sheet-style presentation
 * modifiers so consumers can avoid importing the full navigation runtime.
 */

export {
  sheet,
  fullScreenCover,
  popover,
  confirmationDialog,
  inspector,
  presentationDetents,
  inspectorColumnWidth,
  type SheetPresentationOptions,
  type SheetEdge,
  type SheetSize,
  type FullScreenCoverOptions,
  type PopoverArrowEdge,
  type PopoverPresentationOptions,
  type ConfirmationDialogAction,
  type ConfirmationDialogButtonRole,
  type PresentationDetent,
  type InspectorPresentationOptions,
  type InspectorColumnWidthConfig,
  type InspectorPresentationState,
} from './navigation-modifiers'
