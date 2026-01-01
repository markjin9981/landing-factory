
export interface GoogleFont {
    name: string;
    family: string; // The string to use in CSS
    category: 'Korean' | 'English' | 'Handwriting' | 'Display';
}

export const GOOGLE_FONTS_LIST: GoogleFont[] = [
    // Korean
    { name: 'Noto Sans KR', family: 'Noto Sans KR', category: 'Korean' },
    { name: 'Nanum Gothic', family: 'Nanum Gothic', category: 'Korean' },
    { name: 'Nanum Myeongjo', family: 'Nanum Myeongjo', category: 'Korean' },
    { name: 'Nanum Pen Script', family: 'Nanum Pen Script', category: 'Handwriting' },
    { name: 'Do Hyeon', family: 'Do Hyeon', category: 'Display' },
    { name: 'Jua', family: 'Jua', category: 'Display' },
    { name: 'Gowun Dodum', family: 'Gowun Dodum', category: 'Korean' },
    { name: 'Gowun Batang', family: 'Gowun Batang', category: 'Korean' },
    { name: 'Dongle', family: 'Dongle', category: 'Display' },

    // English
    { name: 'Roboto', family: 'Roboto', category: 'English' },
    { name: 'Open Sans', family: 'Open Sans', category: 'English' },
    { name: 'Montserrat', family: 'Montserrat', category: 'English' },
    { name: 'Lato', family: 'Lato', category: 'English' },
    { name: 'Poppins', family: 'Poppins', category: 'English' },
    { name: 'Playfair Display', family: 'Playfair Display', category: 'Display' },
];

export const generateGoogleFontUrl = (fontFamily: string): string => {
    // Replace spaces with +
    const formattedFamily = fontFamily.replace(/\s+/g, '+');
    // Request weights: 400, 700
    return `https://fonts.googleapis.com/css2?family=${formattedFamily}:wght@400;700&display=swap`;
};
