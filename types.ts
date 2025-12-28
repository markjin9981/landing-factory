export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string; // Internal ID for the field (e.g., 'name', 'phone', 'location')
  label: string;
  type: 'text' | 'tel' | 'email' | 'select' | 'textarea' | 'radio';
  placeholder?: string;
  required: boolean;
  options?: FieldOption[]; // For select or radio types
}

export interface LandingTheme {
  primaryColor: string; // Hex code or Tailwind color class prefix (handled via inline styles or template literals)
  secondaryColor: string;
  fontFamily?: string;
}

// Typography Style Interface
export interface TextStyle {
  fontSize?: string; // px or rem
  fontWeight?: string; // '400', '700'
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: string;
}

// Form Design Interface
export interface FormStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string; // px
  borderRadius?: string; // px or rem
  textColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  buttonRadius?: string;
}

// Updated: Floating Banner with Size
export interface FloatingBanner {
  id: string; // Unique ID for array key
  isShow: boolean;
  text: string;
  imageUrl?: string;
  linkUrl?: string;
  backgroundColor: string;
  textColor: string;
  position: 'top' | 'bottom';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // New: 5-level size adjustment
}

export interface HeroSection {
  headline: string;
  headlineStyle?: TextStyle;
  subHeadline: string;
  subHeadlineStyle?: TextStyle;
  ctaText: string;
  backgroundImage?: string; // URL
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // New: 5-level section height
}

export interface ProblemSection {
  title: string;
  description: string;
  points: string[];
}

export interface SolutionSection {
  title: string;
  description: string;
  features: { title: string; desc: string; icon?: string }[];
}

export interface TrustSection {
  reviews: { name: string; text: string; rating: number }[];
  stats?: { label: string; value: string }[];
}

export interface FormSection {
  title: string;
  subTitle: string;
  submitButtonText: string;

  // New: Custom Success Message
  submitSuccessTitle?: string;
  submitSuccessMessage?: string;

  // New: Form Position & Layout Control
  position?: 'bottom' | 'after_hero';
  layout?: 'vertical' | 'grid'; // 'vertical' (1 column), 'grid' (2 columns on desktop)

  fields: FormField[];

  // Toggles for policies
  showPrivacyPolicy: boolean;
  showTerms: boolean;
  showMarketingConsent: boolean;
  showThirdPartyConsent: boolean;

  // Policy Content
  privacyPolicyContent?: string;
  termsContent?: string;
  marketingConsentContent?: string;
  thirdPartyConsentContent?: string;

  // Custom Style
  style?: FormStyle;
}

// New: Footer Configuration
export interface FooterSection {
  isShow: boolean;
  images: string[]; // List of footer images (logos, certificates, etc.)
  copyrightText: string;
  copyrightStyle?: TextStyle;
}

export interface LandingConfig {
  id: string;
  title: string; // Document Title (Browser Tab)

  // New: SEO & Identity Fields
  favicon?: string;
  ogImage?: string;
  ogTitle?: string;       // Custom SNS Title
  ogDescription?: string; // Custom SNS Description
  keywords?: string;      // New: Meta Keywords for SEO

  theme: LandingTheme;

  banners: FloatingBanner[]; // Changed from single banner to array

  hero: HeroSection;

  // Image-based detail content (can replace or supplement text sections)
  detailImages: string[];

  problem: ProblemSection;
  solution: SolutionSection;
  trust: TrustSection;
  formConfig: FormSection;

  footer?: FooterSection; // New Footer Section
}

export interface LeadData {
  timestamp: string;
  landing_id: string;
  name: string;
  phone: string;
  option?: string;
  memo?: string;
  user_agent: string;
  referrer: string;
  page_title?: string; // New: For Email Notification Subject
  [key: string]: string | undefined; // Allow dynamic fields
}

export interface VisitData {
  Timestamp: string;
  'Landing ID': string;
  IP: string;
  Device: string; // 'PC' | 'Mobile'
  OS: string;
  Browser: string;
  Referrer: string;
}