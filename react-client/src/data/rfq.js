/**
 * Requests for quotation and the supplier quotes received against them.
 *
 * @typedef {object} Quote
 * @property {string} id
 * @property {string} supplierId
 * @property {number} pricePerUnitUsd
 * @property {number} deliveryDays
 * @property {number} moq
 * @property {string} incoterm
 * @property {string} validUntil
 *
 * @typedef {object} Rfq
 * @property {string} id
 * @property {string} productId
 * @property {number} quantity
 * @property {number} targetPriceUsd Target price per unit.
 * @property {string} destinationCountry
 * @property {'open' | 'quoted' | 'closed'} status
 * @property {string} createdOn
 * @property {number | null} firstResponseDays Days until the first quote arrived.
 * @property {boolean} hasNewQuote
 * @property {string | null} acceptedQuoteId
 * @property {string} notes
 * @property {Quote[]} quotes
 */

/** @type {Rfq[]} */
export const rfqs = [
  {
    id: 'RFQ-1041',
    productId: 'prd-1001',
    quantity: 500,
    targetPriceUsd: 3.8,
    destinationCountry: 'Germany',
    status: 'open',
    createdOn: '2026-09-14',
    firstResponseDays: null,
    hasNewQuote: false,
    acceptedQuoteId: null,
    notes: 'Need ASTA 570 GL grade, vacuum packed in 25 kg bags. CIF Hamburg.',
    quotes: [],
  },
  {
    id: 'RFQ-1042',
    productId: 'prd-1003',
    quantity: 150,
    targetPriceUsd: 11.5,
    destinationCountry: 'United States',
    status: 'quoted',
    createdOn: '2026-09-08',
    firstResponseDays: 1,
    hasNewQuote: true,
    acceptedQuoteId: null,
    notes: 'White and sand colourways, 300 TC minimum, retail-ready packaging.',
    quotes: [
      {
        id: 'qt-5011',
        supplierId: 'sup-xyz',
        pricePerUnitUsd: 11.8,
        deliveryDays: 24,
        moq: 50,
        incoterm: 'CIF',
        validUntil: '2026-10-05',
      },
      {
        id: 'qt-5012',
        supplierId: 'sup-rajmills',
        pricePerUnitUsd: 11.2,
        deliveryDays: 28,
        moq: 100,
        incoterm: 'FOB',
        validUntil: '2026-10-02',
      },
      {
        id: 'qt-5013',
        supplierId: 'sup-abc',
        pricePerUnitUsd: 12.4,
        deliveryDays: 18,
        moq: 60,
        incoterm: 'CIF',
        validUntil: '2026-09-30',
      },
      {
        id: 'qt-5014',
        supplierId: 'sup-crafts',
        pricePerUnitUsd: 12.9,
        deliveryDays: 21,
        moq: 40,
        incoterm: 'FOB',
        validUntil: '2026-10-10',
      },
    ],
  },
  {
    id: 'RFQ-1043',
    productId: 'prd-1007',
    quantity: 250,
    targetPriceUsd: 5.9,
    destinationCountry: 'Australia',
    status: 'open',
    createdOn: '2026-09-16',
    firstResponseDays: null,
    hasNewQuote: false,
    acceptedQuoteId: null,
    notes: 'Organic certification documents required with the first shipment.',
    quotes: [],
  },
  {
    id: 'RFQ-1044',
    productId: 'prd-1005',
    quantity: 120,
    targetPriceUsd: 14.0,
    destinationCountry: 'United Arab Emirates',
    status: 'open',
    createdOn: '2026-09-19',
    firstResponseDays: null,
    hasNewQuote: false,
    acceptedQuoteId: null,
    notes: 'Two size variants, individually boxed, brand sticker on the base.',
    quotes: [],
  },
  {
    id: 'RFQ-1045',
    productId: 'prd-1002',
    quantity: 800,
    targetPriceUsd: 2.6,
    destinationCountry: 'United Kingdom',
    status: 'closed',
    createdOn: '2026-07-12',
    firstResponseDays: 2,
    hasNewQuote: false,
    acceptedQuoteId: 'qt-4902',
    notes: 'Closed after accepting the Himalayan Organics quote.',
    quotes: [
      {
        id: 'qt-4902',
        supplierId: 'sup-himalayan',
        pricePerUnitUsd: 2.65,
        deliveryDays: 22,
        moq: 250,
        incoterm: 'CIF',
        validUntil: '2026-08-01',
      },
      {
        id: 'qt-4903',
        supplierId: 'sup-abc',
        pricePerUnitUsd: 2.9,
        deliveryDays: 19,
        moq: 300,
        incoterm: 'CIF',
        validUntil: '2026-07-29',
      },
    ],
  },
  {
    id: 'RFQ-1046',
    productId: 'prd-1006',
    quantity: 2000,
    targetPriceUsd: 1.05,
    destinationCountry: 'United Arab Emirates',
    status: 'closed',
    createdOn: '2026-06-24',
    firstResponseDays: 1.5,
    hasNewQuote: false,
    acceptedQuoteId: 'qt-4711',
    notes: 'Closed after accepting the ABC Exports quote for Jebel Ali.',
    quotes: [
      {
        id: 'qt-4711',
        supplierId: 'sup-abc',
        pricePerUnitUsd: 1.08,
        deliveryDays: 20,
        moq: 1000,
        incoterm: 'CFR',
        validUntil: '2026-07-15',
      },
      {
        id: 'qt-4712',
        supplierId: 'sup-coromandel',
        pricePerUnitUsd: 1.14,
        deliveryDays: 17,
        moq: 1500,
        incoterm: 'CFR',
        validUntil: '2026-07-10',
      },
    ],
  },
];

/** Status filter options for the RFQ list. `null` means "no status filter". */
export const rfqStatusFilters = [
  { id: 'all', label: 'All Statuses', status: null },
  { id: 'open', label: 'Open', status: 'open' },
  { id: 'quoted', label: 'Quoted', status: 'quoted' },
  { id: 'closed', label: 'Closed', status: 'closed' },
];

/** Copy for the "New RFQ" form. */
export const newRfqFormCopy = {
  title: 'New Request for Quotation',
  description:
    'Describe what you need. Verified suppliers matching the category respond with a quote.',
  submitLabel: 'Submit RFQ',
  notesPlaceholder: 'Packaging, certification, Incoterm or inspection requirements...',
};

/**
 * @param {string} rfqId
 * @returns {Rfq | undefined}
 */
export function findRfq(rfqId) {
  return rfqs.find((rfq) => rfq.id === rfqId);
}

export default rfqs;
