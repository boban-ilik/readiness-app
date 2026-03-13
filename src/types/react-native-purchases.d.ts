/**
 * Minimal type stub for react-native-purchases.
 *
 * Once you run `npm install` on your Mac this file becomes redundant —
 * the real types ship with the package. You can delete this file after
 * the package is properly installed and the real types are available.
 */
declare module 'react-native-purchases' {
  export interface PurchasesEntitlementInfo {
    isActive: boolean;
    productIdentifier: string;
  }

  export interface PurchasesEntitlementInfos {
    active: Record<string, PurchasesEntitlementInfo | undefined>;
    all: Record<string, PurchasesEntitlementInfo>;
  }

  export interface CustomerInfo {
    entitlements: PurchasesEntitlementInfos;
    activeSubscriptions: string[];
    allPurchasedProductIdentifiers: string[];
    originalPurchaseDate: string | null;
    originalApplicationVersion: string | null;
  }

  export interface PurchasesProduct {
    productIdentifier: string;
    priceString: string;
    price: number;
    currencyCode: string;
    title: string;
    description: string;
    subscriptionPeriod?: string;
    introductoryPrice?: {
      price: number;
      priceString: string;
      period: string;
      periodUnit: string;
      periodNumberOfUnits: number;
      cycles: number;
    } | null;
  }

  export enum PACKAGE_TYPE {
    UNKNOWN = 'UNKNOWN',
    CUSTOM = 'CUSTOM',
    LIFETIME = 'LIFETIME',
    ANNUAL = 'ANNUAL',
    SIX_MONTH = 'SIX_MONTH',
    THREE_MONTH = 'THREE_MONTH',
    TWO_MONTH = 'TWO_MONTH',
    MONTHLY = 'MONTHLY',
    WEEKLY = 'WEEKLY',
  }

  export interface PurchasesPackage {
    identifier: string;
    packageType: PACKAGE_TYPE | string;
    product: PurchasesProduct;
    offeringIdentifier: string;
  }

  export interface PurchasesOffering {
    identifier: string;
    serverDescription: string;
    availablePackages: PurchasesPackage[];
    lifetime:    PurchasesPackage | null;
    annual:      PurchasesPackage | null;
    sixMonth:    PurchasesPackage | null;
    threeMonth:  PurchasesPackage | null;
    twoMonth:    PurchasesPackage | null;
    monthly:     PurchasesPackage | null;
    weekly:      PurchasesPackage | null;
  }

  export interface PurchasesOfferings {
    all: Record<string, PurchasesOffering>;
    current: PurchasesOffering | null;
  }

  export interface PurchaseResult {
    productIdentifier: string;
    customerInfo: CustomerInfo;
  }

  export interface PurchasesConfiguration {
    apiKey: string;
    appUserID?: string;
    observerMode?: boolean;
    useAmazon?: boolean;
  }

  export type CustomerInfoUpdateListener = (info: CustomerInfo) => void;

  export interface PurchasesStatic {
    configure(config: PurchasesConfiguration): void;
    getCustomerInfo(): Promise<CustomerInfo>;
    getOfferings(): Promise<PurchasesOfferings>;
    purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult>;
    restorePurchases(): Promise<CustomerInfo>;
    addCustomerInfoUpdateListener(listener: CustomerInfoUpdateListener): void;
    removeCustomerInfoUpdateListener(listener: CustomerInfoUpdateListener): void;
    logIn(appUserID: string): Promise<{ customerInfo: CustomerInfo; created: boolean }>;
    logOut(): Promise<CustomerInfo>;
    setAttributes(attributes: Record<string, string>): void;
  }

  const Purchases: PurchasesStatic;
  export default Purchases;
}
