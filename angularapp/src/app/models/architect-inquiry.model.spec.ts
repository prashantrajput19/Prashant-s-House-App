import { ArchitectInquiry } from './architect-inquiry.model';

describe('ArchitectInquiryModel', () => {

  fit('frontend_Architect_Inquiry_model_should_create_an_instance', () => {
    const architectInquiry: ArchitectInquiry = {
      inquiryId: 1,
      user: {
        userId: 123,
      },
      architect: {
        architectId: 456,
        name: 'John Architect'
      },
      message: 'What are your rates for residential projects?',
      status: 'Pending',
      inquiryDate: '2025-01-22T10:00:00.000Z',
      responseDate: '2025-01-23T10:00:00.000Z',
      priority: 'High',
      contactDetails: 'jane.doe@example.com'
    };

    expect(architectInquiry).toBeTruthy();
    expect(architectInquiry.message).toBeDefined();
    expect(architectInquiry.priority).toBeDefined();
    expect(architectInquiry.user).toBeDefined();
    expect(architectInquiry.architect).toBeDefined();
    expect(architectInquiry.status).toBeDefined();
    expect(architectInquiry.inquiryDate).toBeDefined();
    expect(architectInquiry.responseDate).toBeDefined();
    expect(architectInquiry.contactDetails).toBeDefined();
  });

});
