/** At least one viewport under the sticky header (h-14 / sm:h-16).
 *  Uses min-height (not fixed height) so sections grow with content on
 *  small screens instead of clipping and overlapping the next block. */
export const HOME_VIEWPORT_SECTION =
    'min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)]';

/** Inner shell: full height column, no internal scroll. */
export const HOME_SECTION_INNER = 'mx-auto flex h-full max-w-7xl flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8';

/** Compact section heading block with space before content. */
export const HOME_SECTION_HEADER = 'mx-auto mb-6 max-w-2xl shrink-0 text-center sm:mb-8';

/** Main content — fills remaining space, no internal scroll. */
export const HOME_SECTION_BODY = 'min-h-0 flex-1 overflow-hidden flex flex-col justify-start';

/** Subtitle — visible from sm; spacing below handled by header block margin. */
export const HOME_SECTION_SUBTITLE = 'mt-1.5 block text-sm text-gray-500 sm:mt-2';

/** Shared home section title styling. */
export const HOME_SECTION_TITLE = 'text-xl font-bold sm:text-2xl';

/** Footer row for dots + CTA. */
export const HOME_SECTION_FOOTER = 'mt-3 flex shrink-0 flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4';

export const HOME_CTA_LINK = 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border-2 border-gray-200 bg-white px-6 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700';
