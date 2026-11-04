// Shared JSON-LD nodes and helpers. Base.astro always emits `organization`,
// `founder` and `website`; pages add their own nodes through the `schema` prop.
// Facts here are the ones published elsewhere on the site or in the App Store
// listing: legal name and address from /privacy/, seller name from the App
// Store record, support address from the footer.

export const SITE = 'https://thereadiness.app';
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;
export const FOUNDER_ID = `${SITE}/#founder`;
export const APP_ID = `${SITE}/#app`;
export const APP_STORE_URL = 'https://apps.apple.com/app/id6760478506';
export const LOGO_URL = `${SITE}/icon-512.png`;
export const OG_IMAGE_URL = `${SITE}/og.png`;

type Node = Record<string, unknown>;

export const founder: Node = {
  '@type': 'Person',
  '@id': FOUNDER_ID,
  name: 'Boban Ilikj',
  jobTitle: 'Founder',
  worksFor: { '@type': 'Organization', '@id': ORG_ID, name: 'Readiness' },
};

export const organization: Node = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Readiness',
  legalName: 'Readiness DOO',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', '@id': `${SITE}/#logo`, url: LOGO_URL, width: 512, height: 512 },
  description:
    'Maker of Readiness Coach, an iOS app that turns HRV, resting heart rate and sleep from Apple Health into a daily readiness score and training guidance.',
  founder: { '@type': 'Person', '@id': FOUNDER_ID, name: 'Boban Ilikj' },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '29 November 97',
    postalCode: '1220',
    addressLocality: 'Tetovo',
    addressCountry: 'MK',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@thereadiness.app',
    url: `${SITE}/support/`,
  },
  knowsAbout: [
    { '@type': 'Thing', name: 'Heart rate variability', '@id': 'https://www.wikidata.org/wiki/Q933954' },
    { '@type': 'Thing', name: 'Resting heart rate', '@id': 'https://www.wikidata.org/wiki/Q11976246' },
    { '@type': 'Thing', name: 'Sleep', '@id': 'https://www.wikidata.org/wiki/Q35831' },
    { '@type': 'Thing', name: 'Overtraining', '@id': 'https://www.wikidata.org/wiki/Q334310' },
    { '@type': 'Thing', name: 'Apple Health', '@id': 'https://www.wikidata.org/wiki/Q19863865' },
    { '@type': 'Thing', name: 'Physical fitness', '@id': 'https://www.wikidata.org/wiki/Q309252' },
  ],
};

export const website: Node = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: 'Readiness',
  url: `${SITE}/`,
  inLanguage: 'en',
  publisher: { '@type': 'Organization', '@id': ORG_ID, name: 'Readiness' },
};

export const publisherRef: Node = { '@type': 'Organization', '@id': ORG_ID, name: 'Readiness' };
export const authorRef: Node = { '@type': 'Person', '@id': FOUNDER_ID, name: 'Boban Ilikj' };
export const websiteRef: Node = { '@type': 'WebSite', '@id': WEBSITE_ID, name: 'Readiness' };

export function breadcrumbs(pageUrl: string, items: { name: string; url: string }[]): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
