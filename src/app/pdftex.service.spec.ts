import { TestBed } from '@angular/core/testing';

import { PdfTex } from './pdftex.service';

describe('LatexService', () => {
  let service: PdfTex;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfTex);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
