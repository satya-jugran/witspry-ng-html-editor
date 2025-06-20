import { TestBed } from '@angular/core/testing';

import { WitspryNgHtmlEditorService } from './witspry-ng-html-editor.service';

describe('WitspryNgHtmlEditorService', () => {
  let service: WitspryNgHtmlEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WitspryNgHtmlEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
