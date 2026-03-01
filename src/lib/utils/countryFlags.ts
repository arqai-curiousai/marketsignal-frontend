
// Country code to flag emoji mapping
export const COUNTRY_FLAGS: Record<string, string> = {
    US: '🇺🇸', IN: '🇮🇳', GB: '🇬🇧', CA: '🇨🇦', DE: '🇩🇪',
    NL: '🇳🇱', HK: '🇭🇰', JP: '🇯🇵', SG: '🇸🇬', AU: '🇦🇺',
    CN: '🇨🇳', AE: '🇦🇪',
};

export const getCountryFlag = (countryCode: string): string => {
    return COUNTRY_FLAGS[countryCode?.toUpperCase()] || '🌐';
};
