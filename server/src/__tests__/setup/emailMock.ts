jest.mock('../../services/email.service', () => ({
  isEmailConfigured: jest.fn(() => false),
  dispatchEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(async () => undefined),
  sendNewUserAdminNotification: jest.fn(async () => undefined),
  sendContactAdminNotification: jest.fn(async () => undefined),
  sendContactConfirmation: jest.fn(async () => undefined),
}));
