import { COUNTRY_SPECS } from '@src/constants/CountrySpecs';

type CountrySpec = {
  minLength: number;
  maxLength: number;
  countries?: string[];
};

// type CountrySpecs = {
//   [key: string]: CountrySpec;
// };

type ValidationError = {
  isValid: false;
  error: string;
};

type ValidationSuccess = {
  isValid: true;
  formattedNumber: string;
  countryCode: string;
  nationalNumber: string;
  length: number;
  countries?: string[];
};

type ValidationResult = ValidationError | ValidationSuccess;

type PhoneValidationInput = {
  countryCode: number;
  phoneNumber: number;
};

function cleanPhoneInput(input: number): string {
  return input.toString().replace(/\D/g, '');
}

function validateCountryCode(countryCode: string): ValidationError | null {
  if (!COUNTRY_SPECS.hasOwnProperty(countryCode)) {
    return {
      isValid: false,
      error: `Invalid country code: ${countryCode}`,
    };
  }
  return null;
}

function getCountryInfo(countryCode: string, countries?: string[]): string {
  return countries
    ? `NANP (${countries.join(', ')})`
    : `country code +${countryCode}`;
}

function validateLength(
  phoneNumber: string,
  countrySpec: CountrySpec,
  countryCode: string,
): ValidationError | null {
  const { minLength, maxLength, countries } = countrySpec;

  if (phoneNumber.length < minLength || phoneNumber.length > maxLength) {
    const countryInfo = getCountryInfo(countryCode, countries);
    const expectedLength =
      minLength === maxLength ? minLength : `${minLength}-${maxLength}`;

    return {
      isValid: false,
      error: `Invalid phone number length for ${countryInfo}. Expected ${expectedLength} digits, got ${phoneNumber.length}`,
    };
  }
  return null;
}

function createSuccessResult(
  countryCode: string,
  phoneNumber: string,
  countries?: string[],
): ValidationSuccess {
  return {
    isValid: true,
    formattedNumber: `+${countryCode}${phoneNumber}`,
    countryCode,
    nationalNumber: phoneNumber,
    length: phoneNumber.length,
    countries,
  };
}

export default function validatePhoneNumber({
  countryCode,
  phoneNumber,
}: PhoneValidationInput): ValidationResult {
  const cleanCountryCode = cleanPhoneInput(countryCode);
  const cleanPhoneNumber = cleanPhoneInput(phoneNumber);

  const countryCodeError = validateCountryCode(cleanCountryCode);
  if (countryCodeError) return countryCodeError;

  // Use type assertion since we've validated the key exists
  const countrySpec =
    COUNTRY_SPECS[cleanCountryCode as keyof typeof COUNTRY_SPECS];

  const lengthError = validateLength(
    cleanPhoneNumber,
    countrySpec,
    cleanCountryCode,
  );
  if (lengthError) return lengthError;

  return createSuccessResult(cleanCountryCode, cleanPhoneNumber);
}
