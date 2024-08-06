import { TestBed } from '@angular/core/testing';

import { LatexService } from './pdftex.service';

describe('LatexService', () => {
  let service: LatexService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LatexService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
