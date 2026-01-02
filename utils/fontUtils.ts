
export interface GoogleFont {
    name: string;
    family: string;
    category: 'Korean' | 'English' | 'Handwriting' | 'Display' | 'Naver';
    url?: string; // Optional custom URL for non-Google fonts (e.g. Naver)
}

export const GOOGLE_FONTS_LIST: GoogleFont[] = [
    // --- NAVER FONTS ---
    { name: 'Nanum Square Neo', family: 'NanumSquareNeo', category: 'Naver', url: 'https://hangeul.pstatic.net/hangeul_static/css/nanum-square-neo.css' },
    { name: 'Nanum Square', family: 'NanumSquare', category: 'Naver', url: 'https://hangeul.pstatic.net/hangeul_static/css/nanum-square.css' },
    { name: 'Nanum Barun Gothic', family: 'NanumBarunGothic', category: 'Naver', url: 'https://hangeul.pstatic.net/hangeul_static/css/nanum-barun-gothic.css' },
    { name: 'Nanum Barun Pen', family: 'NanumBarunpen', category: 'Naver', url: 'https://hangeul.pstatic.net/hangeul_static/css/nanum-barun-pen.css' },

    // --- KOREAN GOTHIC (Sans-Serif) ---
    { name: 'Noto Sans KR', family: 'Noto Sans KR', category: 'Korean' },
    { name: 'Nanum Gothic', family: 'Nanum Gothic', category: 'Korean' },
    { name: 'Gothic A1', family: 'Gothic A1', category: 'Korean' },
    { name: 'Do Hyeon', family: 'Do Hyeon', category: 'Korean' },
    { name: 'Jua', family: 'Jua', category: 'Korean' },
    { name: 'Sunflower', family: 'Sunflower', category: 'Korean' },
    { name: 'Stylish', family: 'Stylish', category: 'Korean' },
    { name: 'Gowun Dodum', family: 'Gowun Dodum', category: 'Korean' },
    { name: 'Hi Melody', family: 'Hi Melody', category: 'Korean' },
    { name: 'Gamja Flower', family: 'Gamja Flower', category: 'Korean' },
    { name: 'Hahmlet', family: 'Hahmlet', category: 'Korean' },
    { name: 'IBM Plex Sans KR', family: 'IBM Plex Sans KR', category: 'Korean' },
    { name: 'Poor Story', family: 'Poor Story', category: 'Korean' },
    { name: 'Yeon Sung', family: 'Yeon Sung', category: 'Korean' },
    { name: 'Black Han Sans', family: 'Black Han Sans', category: 'Korean' },
    { name: 'Black And White Picture', family: 'Black And White Picture', category: 'Korean' },
    { name: 'Cute Font', family: 'Cute Font', category: 'Korean' },
    { name: 'Dokdo', family: 'Dokdo', category: 'Korean' },
    { name: 'East Sea Dokdo', family: 'East Sea Dokdo', category: 'Korean' },
    { name: 'Gaegu', family: 'Gaegu', category: 'Korean' },
    { name: 'Gugi', family: 'Gugi', category: 'Korean' },
    { name: 'Kirang Haerang', family: 'Kirang Haerang', category: 'Korean' },
    { name: 'Single Day', family: 'Single Day', category: 'Korean' },
    { name: 'Jura', family: 'Jura', category: 'Korean' }, // Often used for numbers

    // --- KOREAN MYEONGJO (Serif) ---
    { name: 'Nanum Myeongjo', family: 'Nanum Myeongjo', category: 'Korean' },
    { name: 'Song Myung', family: 'Song Myung', category: 'Korean' },
    { name: 'Gowun Batang', family: 'Gowun Batang', category: 'Korean' },
    { name: 'Noto Serif KR', family: 'Noto Serif KR', category: 'Korean' },
    { name: 'Gaeul', family: 'Gaeul', category: 'Korean' }, // *Check availability, if not standard google, keep to standard

    // --- KOREAN HANDWRITING ---
    { name: 'Nanum Pen Script', family: 'Nanum Pen Script', category: 'Handwriting' },
    { name: 'Nanum Brush Script', family: 'Nanum Brush Script', category: 'Handwriting' },

    // --- ENGLISH SANS ---
    { name: 'Roboto', family: 'Roboto', category: 'English' },
    { name: 'Open Sans', family: 'Open Sans', category: 'English' },
    { name: 'Lato', family: 'Lato', category: 'English' },
    { name: 'Montserrat', family: 'Montserrat', category: 'English' },
    { name: 'Poppins', family: 'Poppins', category: 'English' },
    { name: 'Oswald', family: 'Oswald', category: 'English' },
    { name: 'Source Sans Pro', family: 'Source Sans Pro', category: 'English' },
    { name: 'Raleway', family: 'Raleway', category: 'English' },
    { name: 'PT Sans', family: 'PT Sans', category: 'English' },
    { name: 'Nunito', family: 'Nunito', category: 'English' },
    { name: 'Ubuntu', family: 'Ubuntu', category: 'English' },
    { name: 'Inter', family: 'Inter', category: 'English' },
    { name: 'Rubik', family: 'Rubik', category: 'English' },
    { name: 'Work Sans', family: 'Work Sans', category: 'English' },

    // --- ENGLISH SERIF ---
    { name: 'Roboto Slab', family: 'Roboto Slab', category: 'English' },
    { name: 'Playfair Display', family: 'Playfair Display', category: 'English' },
    { name: 'Lora', family: 'Lora', category: 'English' },
    { name: 'Merriweather', family: 'Merriweather', category: 'English' },
    { name: 'PT Serif', family: 'PT Serif', category: 'English' },
    { name: 'Noto Serif', family: 'Noto Serif', category: 'English' },
    { name: 'Bitter', family: 'Bitter', category: 'English' },
    { name: 'Crimson Text', family: 'Crimson Text', category: 'English' },
    { name: 'Libre Baskerville', family: 'Libre Baskerville', category: 'English' },

    // --- ENGLISH HANDWRITING / DISPLAY ---
    { name: 'Lobster', family: 'Lobster', category: 'Display' },
    { name: 'Pacifico', family: 'Pacifico', category: 'Display' },
    { name: 'Dancing Script', family: 'Dancing Script', category: 'Display' },
    { name: 'Caveat', family: 'Caveat', category: 'Display' },
    { name: 'Indie Flower', family: 'Indie Flower', category: 'Display' },
    { name: 'Satisfy', family: 'Satisfy', category: 'Display' },
    { name: 'Permanent Marker', family: 'Permanent Marker', category: 'Display' },
    { name: 'Amatic SC', family: 'Amatic SC', category: 'Display' },
    { name: 'Shadows Into Light', family: 'Shadows Into Light', category: 'Display' },
    { name: 'Abril Fatface', family: 'Abril Fatface', category: 'Display' },
    { name: 'Bebas Neue', family: 'Bebas Neue', category: 'Display' },
    { name: 'Righteous', family: 'Righteous', category: 'Display' },
    { name: 'Comfortaa', family: 'Comfortaa', category: 'Display' },
    { name: 'Fredoka One', family: 'Fredoka One', category: 'Display' },

    // ... Additional popular ones to reach ~100 if needed, but ~70 covers most bases.
    // Adding few more high quality
    { name: 'Fira Sans', family: 'Fira Sans', category: 'English' },
    { name: 'Mulish', family: 'Mulish', category: 'English' },
    { name: 'Quicksand', family: 'Quicksand', category: 'English' },
    { name: 'Barlow', family: 'Barlow', category: 'English' },
    { name: 'Josefin Sans', family: 'Josefin Sans', category: 'English' },
    { name: 'Arvo', family: 'Arvo', category: 'English' },
    { name: 'Vollkorn', family: 'Vollkorn', category: 'English' },
];

export const generateGoogleFontUrl = (fontFamily: string): string => {
    // 1. Check if it's a Naver font or has custom URL
    const fontDef = GOOGLE_FONTS_LIST.find(f => f.family === fontFamily);
    if (fontDef && fontDef.url) {
        return fontDef.url;
    }

    // 2. Standard Google Font
    // Replace spaces with +
    const formattedFamily = fontFamily.replace(/\s+/g, '+');
    // Request weights: 300, 400, 500, 700, 900 to ensure bold works
    return `https://fonts.googleapis.com/css2?family=${formattedFamily}:wght@300;400;500;700;900&display=swap`;
};
