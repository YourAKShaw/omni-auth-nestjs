// Based on ITU-T E.164 international phone number standards
export const COUNTRY_SPECS = {
  // Afghanistan
  '93': { minLength: 9, maxLength: 9 },
  // Albania
  '355': { minLength: 9, maxLength: 9 },
  // Algeria
  '213': { minLength: 9, maxLength: 9 },
  // American Samoa
  '1684': { minLength: 7, maxLength: 7 },
  // Andorra
  '376': { minLength: 6, maxLength: 9 },
  // Angola
  '244': { minLength: 9, maxLength: 9 },
  // Antigua and Barbuda
  '1268': { minLength: 7, maxLength: 7 },
  // Argentina
  '54': { minLength: 10, maxLength: 11 },
  // Armenia
  '374': { minLength: 8, maxLength: 8 },
  // Australia
  '61': { minLength: 9, maxLength: 9 },
  // Austria
  '43': { minLength: 10, maxLength: 13 },
  // Azerbaijan
  '994': { minLength: 9, maxLength: 9 },
  // Bahamas
  '1242': { minLength: 7, maxLength: 7 },
  // Bahrain
  '973': { minLength: 8, maxLength: 8 },
  // Bangladesh
  '880': { minLength: 10, maxLength: 10 },
  // Barbados
  '1246': { minLength: 7, maxLength: 7 },
  // Belarus
  '375': { minLength: 9, maxLength: 9 },
  // Belgium
  '32': { minLength: 9, maxLength: 9 },
  // Belize
  '501': { minLength: 7, maxLength: 7 },
  // Benin
  '229': { minLength: 8, maxLength: 8 },
  // Bhutan
  '975': { minLength: 8, maxLength: 8 },
  // Bolivia
  '591': { minLength: 8, maxLength: 8 },
  // Bosnia and Herzegovina
  '387': { minLength: 8, maxLength: 8 },
  // Botswana
  '267': { minLength: 8, maxLength: 8 },
  // Brazil
  '55': { minLength: 10, maxLength: 11 },
  // Brunei
  '673': { minLength: 7, maxLength: 7 },
  // Bulgaria
  '359': { minLength: 9, maxLength: 9 },
  // Burkina Faso
  '226': { minLength: 8, maxLength: 8 },
  // Cambodia
  '855': { minLength: 8, maxLength: 9 },
  // Cameroon
  '237': { minLength: 9, maxLength: 9 },
  // China
  '86': { minLength: 11, maxLength: 11 },
  // Colombia
  '57': { minLength: 10, maxLength: 10 },
  // Costa Rica
  '506': { minLength: 8, maxLength: 8 },
  // Croatia
  '385': { minLength: 9, maxLength: 9 },
  // Cuba
  '53': { minLength: 8, maxLength: 8 },
  // Cyprus
  '357': { minLength: 8, maxLength: 8 },
  // Czech Republic
  '420': { minLength: 9, maxLength: 9 },
  // Denmark
  '45': { minLength: 8, maxLength: 8 },
  // Egypt
  '20': { minLength: 10, maxLength: 10 },
  // Estonia
  '372': { minLength: 7, maxLength: 8 },
  // Finland
  '358': { minLength: 9, maxLength: 10 },
  // France
  '33': { minLength: 9, maxLength: 9 },
  // Germany
  '49': { minLength: 10, maxLength: 11 },
  // Greece
  '30': { minLength: 10, maxLength: 10 },
  // Hong Kong
  '852': { minLength: 8, maxLength: 8 },
  // Hungary
  '36': { minLength: 9, maxLength: 9 },
  // Iceland
  '354': { minLength: 7, maxLength: 9 },
  // India
  '91': { minLength: 10, maxLength: 10 },
  // Indonesia
  '62': { minLength: 9, maxLength: 12 },
  // Iran
  '98': { minLength: 10, maxLength: 10 },
  // Iraq
  '964': { minLength: 10, maxLength: 10 },
  // Ireland
  '353': { minLength: 9, maxLength: 9 },
  // Israel
  '972': { minLength: 9, maxLength: 9 },
  // Italy
  '39': { minLength: 9, maxLength: 11 },
  // Japan
  '81': { minLength: 10, maxLength: 10 },
  // Jordan
  '962': { minLength: 9, maxLength: 9 },
  // Kenya
  '254': { minLength: 9, maxLength: 10 },
  // Kuwait
  '965': { minLength: 8, maxLength: 8 },
  // Lebanon
  '961': { minLength: 7, maxLength: 8 },
  // Malaysia
  '60': { minLength: 9, maxLength: 10 },
  // Mexico
  '52': { minLength: 10, maxLength: 10 },
  // Morocco
  '212': { minLength: 9, maxLength: 9 },
  // Netherlands
  '31': { minLength: 9, maxLength: 9 },
  // New Zealand
  '64': { minLength: 8, maxLength: 10 },
  // Nigeria
  '234': { minLength: 10, maxLength: 10 },
  // Norway
  '47': { minLength: 8, maxLength: 8 },
  // Pakistan
  '92': { minLength: 10, maxLength: 10 },
  // Philippines
  '63': { minLength: 10, maxLength: 10 },
  // Poland
  '48': { minLength: 9, maxLength: 9 },
  // Portugal
  '351': { minLength: 9, maxLength: 9 },
  // Qatar
  '974': { minLength: 8, maxLength: 8 },
  // Romania
  '40': { minLength: 9, maxLength: 9 },
  // Russia
  '7': { minLength: 10, maxLength: 10 },
  // Saudi Arabia
  '966': { minLength: 9, maxLength: 9 },
  // Singapore
  '65': { minLength: 8, maxLength: 8 },
  // South Africa
  '27': { minLength: 9, maxLength: 9 },
  // South Korea
  '82': { minLength: 9, maxLength: 10 },
  // Spain
  '34': { minLength: 9, maxLength: 9 },
  // Sweden
  '46': { minLength: 9, maxLength: 9 },
  // Switzerland
  '41': { minLength: 9, maxLength: 9 },
  // Taiwan
  '886': { minLength: 9, maxLength: 9 },
  // Thailand
  '66': { minLength: 9, maxLength: 9 },
  // Turkey
  '90': { minLength: 10, maxLength: 10 },
  // UAE
  '971': { minLength: 9, maxLength: 9 },
  // UK
  '44': { minLength: 10, maxLength: 10 },
  // NANP (North American Numbering Plan) countries
  '1': { minLength: 10, maxLength: 10, countries: ['USA', 'Canada'] },
  // Vietnam
  '84': { minLength: 9, maxLength: 10 },
};
