import { TestBed } from '@angular/core/testing';

import { PuzzleTemplatingService } from './puzzle_templating.service';

describe('LatexService', () => {
  let service: PuzzleTemplatingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PuzzleTemplatingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
