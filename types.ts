export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string; // Internal ID for the field (e.g., 'name', 'phone', 'location')
  label: string;
  type: 'text' | 'tel' | 'email' | 'select' | 'textarea' | 'radio' | 'checkbox' | 'time' | 'date' | 'address' | 'number';
  placeholder?: string;
  required: boolean;
  options?: FieldOption[]; // For select or radio types
  timeConfig?: {
    startTime?: string; // "09:00"
    endTime?: string;   // "18:00"
    interval?: number;  // 30
  };
}

export interface LandingTheme {
  primaryColor: string; // Hex code or Tailwind color class prefix (handled via inline styles or template literals)
  secondaryColor: string;
  fontFamily?: string;
  fontConfig?: FontConfig; // Global/Primary
  customFonts?: CustomFont[]; // New: User-added fonts
}

// Typography Style Interface
export interface FontConfig {
  primaryFont: string; // e.g., 'Noto Sans KR'
  secondaryFont?: string; // Optional header font
  source: 'google' | 'local'; // 'google' usually
}

export interface CustomFont {
  id: string; // UUID
  name: string; // Display Name
  family: string; // CSS Font Family name
  source: 'google' | 'file';
  url: string; // Google Font Name or File URL
  format?: string; // e.g. 'woff2', 'woff', 'truetype'
}

export interface GlobalSettings {
  customFonts: CustomFont[];
  favoriteFonts: string[]; // List of font family names that are starred
}

export interface TextStyle {
  fontSize?: string; // px or rem
  fontWeight?: string; // '400', '700'
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: string;
  fontFamily?: string; // New: Granular control
  // New: Gradient Text Support
  gradientFrom?: string;
  gradientTo?: string;
  gradientVia?: string;
  gradientDirection?: string; // e.g. 'to-r', 'to-br'
}

// Button Animation Types
export type ButtonAnimationType = 'none' | 'pulse' | 'shimmer' | 'bounce' | 'heartbeat' | 'wiggle' | 'hyper-shimmer';

// Button Style Interface
export interface ButtonStyle {
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontSize?: string;
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto'; // Expanded width options
  alignment?: 'left' | 'center' | 'right';
  fontWeight?: string;
  fontFamily?: string; // New: Custom Font
  animation?: ButtonAnimationType; // New: Animation Type
  // New: Gradient Button Support
  gradientFrom?: string;
  gradientTo?: string;
  gradientVia?: string;
  gradientDirection?: string;
}

// Form Design Interface
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
  fontSize?: string; // px or rem (overrides size preset)
  fontFamily?: string; // Custom Font - NOW PROPERLY APPLIED
  fontWeight?: string; // ENHANCEMENT #1: Font weight support
  isSliding?: boolean; // New: Marquee effect
  slideSpeed?: number; // New: Duration in seconds (e.g. 10, 20)
  isCustomShape?: boolean; // New: Render as raw image without box style
  animation?: ButtonAnimationType; // New: Attention grabbing animation
  // NEW: Banner-specific animation effects (5 types)
  bannerAnimation?: 'none' | 'pulse' | 'glow' | 'bounce' | 'shake' | 'blink';
  // NEW: Image background mode
  backgroundImageUrl?: string;      // Background image URL
  backgroundImageOpacity?: number;  // Opacity 0-100 (default 100)
}

export interface HeroSection {
  isShow?: boolean; // New: Toggle Hero Section
  headline: string;
  headlineStyle?: TextStyle;
  subHeadline: string;
  subHeadlineStyle?: TextStyle;
  ctaText: string;
  ctaStyle?: ButtonStyle;
  backgroundImage?: string;
  size?: '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'; // Expanded range
}
// ... (Skipping Problem/Solution/Trust for brevity in matching, only showing relevant interfaces if needed context, but I will target specific lines or blocks)

// Using multiple replace blocks to be precise.

// 1. FormStyle
export interface FormStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string; // px
  borderRadius?: string; // px or rem
  textColor?: string;
  preset?: string; // New: Selected preset ID (e.g. 'standard', 'dark')

  // Title Styling
  titleColor?: string;
  titleFontSize?: string;
  titleAlign?: 'left' | 'center' | 'right';
  titleFontFamily?: string; // New: Custom Font

  // Input Field Styling
  inputFontFamily?: string; // New: Custom Font

  // Button Styling
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  buttonRadius?: string;
  buttonFontSize?: string;
  buttonWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto';
  buttonAlign?: 'left' | 'center' | 'right';
  buttonFontFamily?: string;
  buttonAnimation?: ButtonAnimationType;
  securityBadgeId?: string; // New: Security Footer Preset ID (0-10)

  // Layout
  fieldsPerPage?: number; // New: Fields per page control (0 = all, 1 = one by one)

  // Container Styling (Unified)
  containerBgColor?: string;
  containerBgOpacity?: number;
  containerBorderColor?: string;
  containerBorderRadius?: string;
  containerPadding?: string;
  containerMaxHeight?: string;

  // Question Styling
  questionColor?: string;
  questionSize?: string;
  questionFont?: string;

  // Answer Styling
  answerColor?: string;
  answerBgColor?: string;
  answerBorderColor?: string;
  answerFont?: string;
  answerFontSize?: string;
}

// 2. UrgencyConfig
export interface UrgencyConfig {
  // Countdown
  showCountdown: boolean;
  countdownTarget?: string; // ISO Date string
  countdownLabel?: string;  // "Event ends in:"
  countdownExpiredMessage?: string; // "Event Ended"

  // Timer Customization
  timerStyle?: {
    fontSize?: string; // 'sm', 'md', 'lg', 'xl'
    textColor?: string;
    backgroundColor?: string;
    borderRadius?: string;

    // V3: Advanced Styling
    labelFontSize?: string;
    labelColor?: string;
    labelFontWeight?: string;
    labelPosition?: 'top' | 'left' | 'bottom' | 'right'; // Expanded to 4 directions
    digitColor?: string; // New: Color for the numbers
    isTransparent?: boolean; // New: No background/border
  };

  timerLabelFontFamily?: string; // New

  // Ticker (Legacy)
  showTicker: boolean;
  tickerMessage?: string;   // "{name} verified"
  tickerType?: 'horizontal' | 'vertical_list';

  // Ticker Configuration V2/V3
  tickerConfig?: {
    mode: 'horizontal' | 'vertical_list';
    scrollMode?: 'continuous' | 'random_step';
    scrollSpeed?: number; // for continuous
    randomRange?: [number, number]; // for random_step [min, max] seconds

    containerStyle?: {
      height?: string;
      backgroundColor?: string;
      borderColor?: string;
      borderRadius?: string;
    };

    listTitle?: string;
    columns: {
      id: string; // unique
      label: string;
      type: 'name' | 'phone' | 'debt' | 'text' | 'gender' | 'custom';
      isEnabled: boolean;
      masking: boolean;
    }[];

    fakeDataRules?: {
      debtRange?: [number, number]; // [min, max] in 'man-won'
    };

    // V3: Custom Data Override
    customData?: Record<string, string>[]; // Array of row objects { colId: value }
  };

  listTitleFontFamily?: string; // New
  listContentFontFamily?: string; // New

  // Legacy flat fields (Deprecated)
  listTitle?: string;
  listColumns?: {
    label: string;
    type: 'name' | 'phone' | 'gender' | 'weight' | 'text';
    masking: boolean;
  }[];
  scrollSpeed?: number;
}

export interface HeroSection {
  isShow?: boolean; // New: Toggle Hero Section
  headline: string;
  headlineStyle?: TextStyle;
  subHeadline: string;
  subHeadlineStyle?: TextStyle;
  ctaText: string;
  ctaStyle?: ButtonStyle;
  backgroundImage?: string;
  overlayOpacity?: number; // New: 0-100% opacity for the black overlay
  verticalAlign?: number; // New: -2 (Top) to +2 (Bottom)
  size?: '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'; // Expanded range
  features?: HeroFeature[]; // New: Feature Grid Items
}

// New: Hero Feature Item Definition
export interface HeroFeature {
  id: string;
  icon?: string; // lucide icon name or emoji
  text: string;
  subText?: string;
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

// New: Rich Media Content for Detail Section
export interface BannerStyle {
  height: string;       // e.g., '300px', '50vh'
  backgroundColor: string;
  backgroundImage?: string;
  overlayOpacity: number; // 0.0 ~ 1.0
  textColor: string;
  fontSize: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  padding: string;
  fontFamily?: string;
}

// V2/V3 UPDATE
export interface UrgencyConfig {
  // Countdown
  showCountdown: boolean;
  countdownTarget?: string; // ISO Date string
  countdownLabel?: string;  // "Event ends in:"
  countdownExpiredMessage?: string; // "Event Ended"

  // Timer Customization
  timerStyle?: {
    fontSize?: string; // 'sm', 'md', 'lg', 'xl'
    textColor?: string;
    backgroundColor?: string;
    borderRadius?: string;

    // V3: Advanced Styling
    labelFontSize?: string;
    labelColor?: string;
    labelFontWeight?: string;
    labelPosition?: 'top' | 'left' | 'bottom' | 'right'; // Expanded to 4 directions
    digitColor?: string; // New: Color for the numbers
    isTransparent?: boolean; // New: No background/border
  };

  // Ticker (Legacy)
  showTicker: boolean;
  tickerMessage?: string;   // "{name} verified"
  tickerType?: 'horizontal' | 'vertical_list';

  // Ticker Configuration V2/V3
  tickerConfig?: {
    mode: 'horizontal' | 'vertical_list';
    scrollMode?: 'continuous' | 'random_step';
    scrollSpeed?: number; // for continuous
    randomRange?: [number, number]; // for random_step [min, max] seconds

    containerStyle?: {
      height?: string;
      backgroundColor?: string;
      borderColor?: string;
      borderRadius?: string;
    };

    listTitle?: string;
    columns: {
      id: string; // unique
      label: string;
      type: 'name' | 'phone' | 'debt' | 'text' | 'gender' | 'custom';
      isEnabled: boolean;
      masking: boolean;
    }[];

    fakeDataRules?: {
      debtRange?: [number, number]; // [min, max] in 'man-won'
    };

    // V3: Custom Data Override
    customData?: Record<string, string>[]; // Array of row objects { colId: value }
  };

  // Legacy flat fields (Deprecated)
  listTitle?: string;
  listColumns?: {
    label: string;
    type: 'name' | 'phone' | 'gender' | 'weight' | 'text';
    masking: boolean;
  }[];
  scrollSpeed?: number;
}


export interface DetailContent {
  id: string;
  type: 'image' | 'youtube' | 'map' | 'banner' | 'video' | 'text';
  content: string; // Image URL, YouTube URL, Address, or Banner Text

  // YouTube specific
  videoSize?: 'sm' | 'md' | 'lg' | 'full';
  autoPlay?: boolean;

  // Map specific
  mapPlaceName?: string;
  mapSize?: 'sm' | 'md' | 'lg' | 'full';

  // Banner specific
  bannerStyle?: BannerStyle;
  urgencyConfig?: UrgencyConfig;

  // Common
  width?: string;
}



// --- NEW INTERFACES ---

export interface SNSLink {
  id: string;
  type: 'instagram' | 'youtube' | 'blog' | 'kakao' | 'custom';
  url: string;
  iconUrl?: string; // For custom
  label?: string; // Tooltip
}

export interface SNSItem {
  id: string; // Unique ID
  type: 'instagram' | 'youtube' | 'kakao' | 'blog' | 'custom';
  url: string;
  label?: string;
  iconType?: 'builtin' | 'upload'; // New
  customIconUrl?: string; // New
}

export interface SNSConfig {
  isShow: boolean;
  position: 'bottom-right' | 'bottom-left' | 'side-right' | 'side-left';
  displayMode?: 'floating' | 'block';
  style: {
    iconSize?: number; // Global size override
    gap?: number;
  };
  // Deprecated fields kept for migration scripts if needed, but UI will use 'items'
  kakao?: string;
  naverBlog?: string;
  instagram?: string;
  youtube?: string;

  items: SNSItem[]; // Main source of truth now
}

export interface NavigationItem {
  label: string;
  link: string;
}

export interface NavigationConfig {
  isShow: boolean;
  showHome?: boolean; // New
  items: NavigationItem[];
  backgroundColor?: string;
  textColor?: string;
  isSticky?: boolean;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
}

export interface GallerySection {
  isShow: boolean;
  showOnMainPage?: boolean; // New
  title: string;
  description?: string;
  layout?: 'grid-2' | 'grid-3' | 'grid-4' | 'masonry';
  gridCols?: number; // 2, 3, 4
  gap?: number; // 2, 4, 6, 8
  images: string[];
}

export interface GlobalSettings {
  adminPassword?: string;
  githubToken?: string;
  imgbbApiKey?: string;
  adminUsers?: Array<{ email: string, name: string, memo: string }>;
}

export interface BoardItem {
  id: string;
  title: string;
  content?: string;
  date: string;
  category?: string;
}

export interface BoardSection {
  isShow: boolean;
  showOnMainPage?: boolean; // New
  type: 'notice' | 'faq' | 'accordion' | 'list'; // 'notice'='list', 'faq'='accordion'
  title: string;
  items: BoardItem[];
}

export interface LocationSection {
  isShow: boolean;
  title: string;
  titleStyle?: TextStyle; // New
  address: string;
  addressStyle?: TextStyle; // New
  detailAddress?: string;
  lat?: number;
  lng?: number;
  showMap: boolean;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'zoom-in';
}

export interface FeatureSection {
  isShow: boolean; // New Section
  title: string;
  description?: string;
  items: FeatureItem[];
}

export interface LandingConfig {
  id: string;
  theme: LandingTheme; // Changed from LandingTheme to ThemeConfig
  font?: string; // Global Font Family
  title: string; // Browser Tab Title

  // New: SEO & Identity Fields
  favicon?: string;
  ogImage?: string;
  ogTitle?: string;       // Custom SNS Title
  ogDescription?: string; // Custom SNS Description

  // Popup
  popupConfig?: PopupConfig;

  // Chat Button
  chatConfig?: ChatButtonConfig;

  keywords?: string;      // New: Meta Keywords for SEO

  // New: Search Engine Verification
  naverVerification?: string;
  googleVerification?: string;

  // Sections
  banners: FloatingBanner[]; // Changed from single banner to array
  hero: HeroSection;
  detailContent: DetailContent[];
  // problem: ProblemSection; // Removed
  // solution: SolutionSection; // Removed
  // trust: TrustSection; // Removed
  formConfig: FormSection;
  footer?: FooterSection; // New Footer Section

  // --- NEW FEATURES (Website Mode) ---
  template?: 'standard' | 'dynamic_step'; // New: Template Selection
  steps?: DynamicStepItem[]; // New: Step Builder Configuration
  layoutMode?: 'mobile' | 'full'; // Default 'mobile'

  snsConfig?: SNSConfig;
  navigation?: NavigationConfig;
  gallery?: GallerySection;
  board?: BoardSection;
  location?: LocationSection; // New
  features?: FeatureSection; // New Smart Feature Block
}

export interface DynamicStepItem {
  id: string;
  type: 'intro' | 'content' | 'form' | 'outro';

  // For 'content': Reference to a DetailContent item (or Background for Intro/Outro)
  contentId?: string;

  // For 'intro'/'outro': Reference to a DetailContent item to insert INLINE (not background)
  insertedContentId?: string;

  // New: Top Content Slot (above Form fields) similar to insertedContent but for Forms
  topContent?: DetailContent;

  // New: Features Override for Intro Step
  features?: HeroFeature[];

  // For 'form': List of field IDs to show on this step
  fieldIds?: string[];

  // Step specific overrides
  title?: string;
  hideTitle?: boolean; // New: Toggle title visibility
  buttonText?: string;

  // Navigation
  showPrevButton?: boolean;
  prevButtonText?: string;
  // New: Button Layout Configuration
  buttonLayout?: 'full' | 'auto' | 'asymmetric' | 'fixed_bottom';

  // Styling
  buttonStyle?: ButtonStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  formStyle?: {
    // Container
    containerBgColor?: string;
    containerBgOpacity?: number;     // NEW: 0-100, transparency control
    containerMaxHeight?: string;     // NEW: e.g., "400px" - triggers scroll
    containerBorderColor?: string;
    containerBorderRadius?: string;
    containerPadding?: string;
    // Question Label
    questionColor?: string;
    questionSize?: string;
    questionFont?: string;
    // Answer Input
    answerColor?: string;
    answerBgColor?: string;
    answerBorderColor?: string;
    answerFont?: string;
    answerFontSize?: string;
    // Layout
    fieldsPerPage?: number; // New: Fields per page control
  };


  // Background Styling (for intro/outro pages)
  backgroundColor?: string;      // Solid color background
  backgroundImage?: string;       // Image URL for background
  backgroundOverlay?: number;     // 0-100 opacity for dark overlay
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

  // Outro Specific
  policyConfig?: {
    showPrivacy?: boolean;
    showTerms?: boolean;
    showMarketing?: boolean;
    showThirdParty?: boolean;
  };

  // ENHANCEMENT #3: Policy Styling - Full Customization
  policyStyle?: {
    // Container Dimensions & Layout
    containerMaxHeight?: string;     // e.g., "300px" - triggers scroll
    containerMaxWidth?: string;      // e.g., "600px" - area width
    containerPadding?: string;       // e.g., "16px" - internal padding
    containerMargin?: string;        // e.g., "0 auto 20px" - external margin

    // Container Styling
    containerBgColor?: string;       // background color
    containerBgOpacity?: number;     // 0-100, transparency control
    containerBorderRadius?: string;  // e.g., "12px" - rounded corners

    // Typography
    itemFontSize?: string;           // e.g., "14px", "0.875rem"
    itemGap?: string;                // space between items, e.g., "8px"
    labelFontSize?: string;          // "약관 전체 동의" font size
    labelFontFamily?: string;        // custom font for labels
    checkboxSize?: string;           // e.g., "18px" - checkbox size

    // Advanced Options
    hideBackground?: boolean;        // hide semi-transparent background

    // Standard CSS Aliases (for easier usage/consistency)
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: string;
    padding?: string;
    mobilePadding?: string; // NEW: Mobile-specific padding override
  };

  // NEW: Mobile Background Toggle (Fix #3)
  hideMobileBackground?: boolean; // true = hide background on mobile

  // ENHANCEMENT #4: Field Overrides - Full Form Field Customization
  fieldOverrides?: {
    [fieldId: string]: {
      label?: string;                  // Override display label
      type?: FormField['type'];        // Override input type (text, tel, email, select, textarea, radio, time, date, address, number)
      required?: boolean;              // Override required status
      placeholder?: string;            // Override placeholder
      options?: FieldOption[];         // Override select/radio options
      timeConfig?: {                   // Time field configuration
        startTime?: string;            // "09:00"
        endTime?: string;              // "18:00"
        interval?: number;             // 30 (minutes)
      };
    };
  };

  // ENHANCEMENT #5: Media Styling - Responsive Size Control
  mediaStyles?: {
    // PC Settings
    pcWidth?: string;          // '100%', '800px', '90vw' etc
    pcHeight?: string;         // 'auto', '600px', '80vh' etc
    pcMaxWidth?: string;       // maximum width constraint
    pcMaxHeight?: string;      // maximum height constraint

    // Mobile Settings
    mobileWidth?: string;
    mobileHeight?: string;
    mobileMaxWidth?: string;
    mobileMaxHeight?: string;

    // Layout & Alignment
    alignment?: 'left' | 'center' | 'right';  // horizontal alignment
    marginTop?: string;        // top margin
    marginBottom?: string;     // bottom margin

    // ENHANCEMENT #5: Inherit from Intro
    inheritFromIntro?: boolean;  // if true, use intro page's media settings
  };

  // ENHANCEMENT #6: Question Container Style - Intro Question Area Customization
  questionContainerStyle?: {
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: string;
    padding?: string;
    maxWidth?: string;
    hideBackground?: boolean;
    // NEW: Layout template and mobile-specific sizing
    layout?: 'standard' | 'inline' | 'compact' | 'minimal' | 'card';
    mobileMaxWidth?: string;  // e.g., '280px', '70%'
    mobilePadding?: string;   // e.g., '0.5rem'
    gap?: string;             // gap between form fields
  };
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

// Popup Interfaces
export interface PopupItem {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  openInNewWindow: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface PopupStyleConfig {
  width: number;
  top: number;
  left: number;
  isCentered: boolean;
}

export interface PopupConfig {
  usePopup: boolean;
  items: PopupItem[];

  // Slider/Playback (Optional for compatibility)
  slideEffect?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number; // seconds

  // Styles (Container Level)
  pcStyle: PopupStyleConfig;
  mobileStyle: PopupStyleConfig;

  // Options
  showDoNotOpenToday: boolean;
  closeButtonColor?: string;
  disableOverlay: boolean;
}

export interface ChatButtonConfig {
  useChat: boolean;
  type: 'kakao' | 'naver' | 'tel' | 'custom';

  iconUrl?: string;
  label?: string; // Bubble text

  // Position
  position: 'right' | 'left'; // "Bottom" is implied
  bottom: number; // px
  side: number; // px (from left or right)
  size: number; // px

  // Action
  linkUrl: string;
  openInNewWindow: boolean;

  // Advanced
  showLabel: boolean;
  isCustomShape?: boolean; // New: Custom Shape Mode
  animation?: ButtonAnimationType; // New: Animation Effect
  labelStyle?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    fontFamily?: string;
  };
}

export interface VisitData {
  [key: string]: any; // Allow dynamic keys from Sheet headers
  timestamp?: string;
  ip?: string;
  device?: string;
  referrer?: string;
}