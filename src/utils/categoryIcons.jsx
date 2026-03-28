/**
 * Shared lab-test category icon SVGs — used by LabOrders, LabResults, and PatientDetail.
 * Each icon is an inline SVG sized via 1em so it scales with font-size.
 */

const iconStyle = { width: '1em', height: '1em', verticalAlign: '-0.125em', fill: 'currentColor' };

const CATEGORY_ICONS = {
  blood: (
    <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true">
      <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z" />
    </svg>
  ),
  urine: (
    <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true">
      <path d="M13 11.33L18 18H6l5-6.67V6h2m3.96-2H8.04c-.57 0-1.04.47-1.04 1.04 0 .57.47 1.04 1.04 1.04H9v4.33L4 18c-.99 1.33.11 3 1.78 3h12.44c1.67 0 2.77-1.67 1.78-3L15 10.33V6h.96c.57 0 1.04-.47 1.04-1.04 0-.57-.47-1.04-1.04-1.04z" />
    </svg>
  ),
  cardiac: (
    <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  imaging: (
    <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
  ),
  pathology: (
    <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true">
      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  ),
  microbiology: (
    <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true">
      <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
    </svg>
  ),
  other: (
    <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  ),
};

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
}

export default CATEGORY_ICONS;
