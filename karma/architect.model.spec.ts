import { Architect } from './architect.model';

describe('ArchitectModel', () => {

  fit('frontend_Architect_model_should_create_an_instance', () => {
    const architect: Architect = {
      architectId: 1,
      name: 'John Doe',
      expertise: 'Residential',
      location: 'New York, NY',
      rating: 4.5,
      portfolioLink: 'http://example.com/portfolio',
      status: 'Active'
    };

    expect(architect).toBeTruthy();
    expect(architect.name).toBeDefined();
    expect(architect.expertise).toBeDefined();
    expect(architect.location).toBeDefined();
    expect(architect.rating).toBeDefined();
    expect(architect.portfolioLink).toBeDefined();
    expect(architect.status).toBeDefined();
  });

});
