import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WitspryNgHtmlEditorComponent } from './witspry-ng-html-editor.component';

describe('WitspryNgHtmlEditorComponent', () => {
  let component: WitspryNgHtmlEditorComponent;
  let fixture: ComponentFixture<WitspryNgHtmlEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WitspryNgHtmlEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WitspryNgHtmlEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
