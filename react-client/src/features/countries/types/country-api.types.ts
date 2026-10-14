/** GET /countries response item — see Country entity on the backend. */
export interface ApiCountry {
  id: string;
  name: string;
  iso2Code: string;
  iso3Code: string;
  isActive: boolean;
}
