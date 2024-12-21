export const TwilioConfig = {
  accountSid:
    process.env.TWILIO_ACCOUNT_SID ||
    (() => {
      throw new Error('TWILIO_ACCOUNT_SID is not set');
    })(),
  authToken:
    process.env.TWILIO_AUTH_TOKEN ||
    (() => {
      throw new Error('TWILIO_AUTH_TOKEN is not set');
    })(),
  verifyServiceSid:
    process.env.TWILIO_VERIFY_SERVICE_SID ||
    (() => {
      throw new Error('TWILIO_VERIFY_SERVICE_SID is not set');
    })(),
};
