/**
 * Supplier reference data.
 *
 * Shared by the product catalogue, orders, RFQ quotes and the profile
 * "Suppliers" tab, so verification status has a single definition.
 *
 * @typedef {object} Supplier
 * @property {string} id
 * @property {string} name
 * @property {string} initials
 * @property {string} location
 * @property {boolean} verified
 * @property {string[]} categories
 * @property {number} responseTimeHours
 * @property {string} contactedOn ISO date of the buyer's last contact.
 */

/** @type {Supplier[]} */
export const suppliers = [
  {
    id: 'sup-abc',
    name: 'ABC Exports',
    initials: 'AE',
    location: 'Kochi, Kerala',
    verified: true,
    categories: ['Spices', 'Agriculture'],
    responseTimeHours: 6,
    contactedOn: '2026-08-28',
  },
  {
    id: 'sup-xyz',
    name: 'XYZ Traders',
    initials: 'XT',
    location: 'Tiruppur, Tamil Nadu',
    verified: false,
    categories: ['Textiles'],
    responseTimeHours: 18,
    contactedOn: '2026-08-11',
  },
  {
    id: 'sup-crafts',
    name: 'India Crafts Co.',
    initials: 'IC',
    location: 'Jaipur, Rajasthan',
    verified: false,
    categories: ['Handicrafts'],
    responseTimeHours: 24,
    contactedOn: '2026-07-30',
  },
  {
    id: 'sup-himalayan',
    name: 'Himalayan Organics',
    initials: 'HO',
    location: 'Dehradun, Uttarakhand',
    verified: true,
    categories: ['Spices', 'Agriculture'],
    responseTimeHours: 9,
    contactedOn: '2026-09-04',
  },
  {
    id: 'sup-coromandel',
    name: 'Coromandel Marine Exports',
    initials: 'CM',
    location: 'Visakhapatnam, Andhra Pradesh',
    verified: false,
    categories: ['Agriculture'],
    responseTimeHours: 32,
    contactedOn: '2026-06-19',
  },
  {
    id: 'sup-rajmills',
    name: 'Rajasthan Textile Mills',
    initials: 'RT',
    location: 'Bhilwara, Rajasthan',
    verified: false,
    categories: ['Textiles'],
    responseTimeHours: 14,
    contactedOn: '2026-05-22',
  },
];

/**
 * @param {string} supplierId
 * @returns {Supplier | undefined}
 */
export function findSupplier(supplierId) {
  return suppliers.find((supplier) => supplier.id === supplierId);
}

export default suppliers;
