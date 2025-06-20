import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  forwardRef, 
  ElementRef, 
  ViewChild, 
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EditorConfig, ThemeType } from '../../interfaces/editor-config.interface';
import { SyntaxHighlightService } from '../../services/syntax-highlight.service';
import { EditorConfigService } from '../../services/editor-config.service';

@Component({
  selector: 'witspry-html-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="html-editor-container" [attr.data-theme]="theme">
      <div class="html-editor-wrapper">
        <!-- Line Numbers -->
        <div 
          *ngIf="config.lineNumbers" 
          class="html-editor-line-numbers"
          [style.font-size]="config.fontSize">
          <div 
            *ngFor="let lineNumber of lineNumbers; trackBy: trackByLineNumber" 
            class="html-editor-line-number">
            {{ lineNumber }}
          </div>
        </div>
        
        <!-- Editor Content -->
        <div class="html-editor-content">
          <!-- Syntax Highlighted Background -->
          <div 
            class="html-editor-highlight-layer"
            [style.font-size]="config.fontSize"
            [innerHTML]="highlightedContent">
          </div>
          
          <!-- Editable Text Area -->
          <textarea
            #editorTextarea
            class="html-editor-textarea"
            [style.font-size]="config.fontSize"
            [style.tab-size]="config.tabSize"
            [placeholder]="placeholder"
            [readonly]="readonly"
            [value]="value"
            (input)="handleInput($event)"
            (keydown)="handleKeydown($event)"
            (focus)="handleFocus()"
            (blur)="handleBlur()"
            (scroll)="handleScroll($event)"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off">
          </textarea>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./html-editor.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HtmlEditorComponent),
      multi: true
    }
  ]
})
export class HtmlEditorComponent implements ControlValueAccessor, AfterViewInit, OnDestroy, OnChanges {
  @Input() config: EditorConfig = {
    tabSize: 2,
    autoIndent: true,
    lineNumbers: true,
    wordWrap: false,
    fontSize: '14px'
  };
  @Input() theme: ThemeType = 'default';
  @Input() readonly: boolean = false;
  @Input() placeholder: string = 'Enter HTML content...';

  @Output() contentChange = new EventEmitter<string>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  @ViewChild('editorTextarea', { static: false }) editorTextarea!: ElementRef<HTMLTextAreaElement>;

  value: string = '';
  highlightedContent: string = '';
  lineNumbers: number[] = [];
  
  private onChange = (value: string) => {};
  private onTouched = () => {};
  private isDisabled = false;

  constructor(
    private syntaxHighlightService: SyntaxHighlightService,
    private editorConfigService: EditorConfigService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.config = this.editorConfigService.mergeWithDefaults(this.config);
    }
    
    if (changes['value'] || changes['config']) {
      this.updateHighlighting();
      this.updateLineNumbers();
    }
  }

  ngAfterViewInit(): void {
    this.updateHighlighting();
    this.updateLineNumbers();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value || '';
    this.updateHighlighting();
    this.updateLineNumbers();
    this.cdr.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.readonly = isDisabled;
    this.cdr.detectChanges();
  }

  // Event handlers
  handleInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
    this.contentChange.emit(this.value);
    this.updateHighlighting();
    this.updateLineNumbers();

    // Handle auto-indentation for closing tags
    if (this.config.autoIndent) {
      setTimeout(() => this.handleClosingTagIndentation(), 0);
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.readonly || this.isDisabled) return;

    // Handle Tab key for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      this.insertTab(event.shiftKey);
      return;
    }

    // Handle Enter key for auto-indentation
    if (event.key === 'Enter' && this.config.autoIndent) {
      event.preventDefault();
      this.handleAutoIndentation();
      return;
    }

    // Handle closing tag auto-indentation
    if (event.key === '>' && this.config.autoIndent) {
      setTimeout(() => this.handleClosingTagIndentation(), 0);
    }
  }

  handleFocus(): void {
    this.focus.emit();
  }

  handleBlur(): void {
    this.onTouched();
    this.blur.emit();
  }

  handleScroll(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const highlightLayer = target.parentElement?.querySelector('.html-editor-highlight-layer') as HTMLElement;
    const lineNumbers = target.parentElement?.parentElement?.querySelector('.html-editor-line-numbers') as HTMLElement;
    
    if (highlightLayer) {
      highlightLayer.scrollTop = target.scrollTop;
      highlightLayer.scrollLeft = target.scrollLeft;
    }
    
    if (lineNumbers) {
      lineNumbers.scrollTop = target.scrollTop;
    }
  }

  // Helper methods
  private updateHighlighting(): void {
    this.highlightedContent = this.syntaxHighlightService.highlightHtml(this.value);
  }

  private updateLineNumbers(): void {
    const lines = this.value.split('\n').length;
    this.lineNumbers = Array.from({ length: lines }, (_, i) => i + 1);
  }

  private insertTab(isShiftTab: boolean): void {
    const textarea = this.editorTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const spaces = ' '.repeat(this.config.tabSize);

    if (isShiftTab) {
      // Remove indentation
      const beforeCursor = this.value.substring(0, start);
      const afterCursor = this.value.substring(end);
      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      const lineBeforeCursor = beforeCursor.substring(lineStart);
      
      if (lineBeforeCursor.startsWith(spaces)) {
        const newValue = beforeCursor.substring(0, lineStart) + 
                        lineBeforeCursor.substring(this.config.tabSize) + 
                        afterCursor;
        this.updateValue(newValue, start - this.config.tabSize, end - this.config.tabSize);
      }
    } else {
      // Add indentation
      const newValue = this.value.substring(0, start) + spaces + this.value.substring(end);
      this.updateValue(newValue, start + this.config.tabSize, start + this.config.tabSize);
    }
  }

  private handleAutoIndentation(): void {
    const textarea = this.editorTextarea.nativeElement;
    const start = textarea.selectionStart;
    const beforeCursor = this.value.substring(0, start);
    const afterCursor = this.value.substring(start);
    const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
    const currentLine = beforeCursor.substring(currentLineStart);
    
    // Calculate indentation level
    const indentMatch = currentLine.match(/^(\s*)/);
    let indent = indentMatch ? indentMatch[1] : '';
    
    // Check if we're inside a tag that should increase indentation
    const openTagMatch = currentLine.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>$/);
    const isOpeningTag = openTagMatch && !currentLine.includes(`</${openTagMatch[1]}>`);
    
    // Check if the next content is IMMEDIATELY a closing tag (no whitespace, same line)
    const immediateClosingTagMatch = afterCursor.match(/^<\/([a-zA-Z][a-zA-Z0-9]*)/);
    const isImmediatelyBeforeClosingTag = immediateClosingTagMatch && openTagMatch &&
                                         immediateClosingTagMatch[1] === openTagMatch[1];
    
    if (isOpeningTag) {
      const tagIndent = indent + ' '.repeat(this.config.tabSize);
      
      if (isImmediatelyBeforeClosingTag) {
        // Only add extra line if closing tag is IMMEDIATELY after opening tag with no content
        // Example: <div>|</div> -> should become <div>\n  |\n</div>
        const newValue = beforeCursor + '\n' + tagIndent + '\n' + indent + afterCursor;
        this.updateValue(newValue, start + 1 + tagIndent.length, start + 1 + tagIndent.length);
      } else {
        // Normal case: just add increased indentation
        // Example: <div>| -> should become <div>\n  |
        const newValue = beforeCursor + '\n' + tagIndent + afterCursor;
        this.updateValue(newValue, start + 1 + tagIndent.length, start + 1 + tagIndent.length);
      }
    } else {
      // Normal indentation - maintain current level
      const newValue = beforeCursor + '\n' + indent + afterCursor;
      this.updateValue(newValue, start + 1 + indent.length, start + 1 + indent.length);
    }
  }

  private handleClosingTagIndentation(): void {
    const textarea = this.editorTextarea.nativeElement;
    const start = textarea.selectionStart;
    const beforeCursor = this.value.substring(0, start);
    
    // Check if we just typed a closing tag
    const closingTagMatch = beforeCursor.match(/<\/([a-zA-Z][a-zA-Z0-9]*)>$/);
    if (!closingTagMatch) return;
    
    const tagName = closingTagMatch[1];
    const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
    const currentLine = beforeCursor.substring(currentLineStart);
    
    // Find the matching opening tag to determine proper indentation
    const openingTagIndent = this.findMatchingOpeningTagIndent(beforeCursor.substring(0, currentLineStart), tagName);
    if (openingTagIndent === null) return;
    
    // Get current indentation of the closing tag line
    const currentIndentMatch = currentLine.match(/^(\s*)/);
    const currentIndent = currentIndentMatch ? currentIndentMatch[1] : '';
    
    // If the indentation is already correct, don't change it
    if (currentIndent === openingTagIndent) return;
    
    // Replace current line indentation with correct indentation
    const lineContentAfterIndent = currentLine.substring(currentIndent.length);
    const newLine = openingTagIndent + lineContentAfterIndent;
    const newValue = beforeCursor.substring(0, currentLineStart) + newLine + this.value.substring(start);
    
    const newCursorPosition = start + (openingTagIndent.length - currentIndent.length);
    this.updateValue(newValue, newCursorPosition, newCursorPosition);
  }

  private findMatchingOpeningTagIndent(content: string, tagName: string): string | null {
    const lines = content.split('\n');
    let tagStack: { name: string; indent: string }[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      
      // Find all tags in this line
      const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
      let match;
      
      while ((match = tagRegex.exec(line)) !== null) {
        const fullTag = match[0];
        const currentTagName = match[1];
        
        if (fullTag.startsWith('</')) {
          // Closing tag - pop from stack
          if (tagStack.length > 0 && tagStack[tagStack.length - 1].name === currentTagName) {
            tagStack.pop();
          }
        } else if (!fullTag.endsWith('/>')) {
          // Opening tag (not self-closing) - push to stack
          tagStack.push({ name: currentTagName, indent });
        }
      }
    }
    
    // Find the matching opening tag for our closing tag
    for (let i = tagStack.length - 1; i >= 0; i--) {
      if (tagStack[i].name === tagName) {
        return tagStack[i].indent;
      }
    }
    
    return null;
  }

  private updateValue(newValue: string, selectionStart: number, selectionEnd: number): void {
    this.value = newValue;
    this.onChange(this.value);
    this.contentChange.emit(this.value);
    this.updateHighlighting();
    this.updateLineNumbers();
    
    // Restore cursor position
    setTimeout(() => {
      const textarea = this.editorTextarea.nativeElement;
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  trackByLineNumber(index: number, lineNumber: number): number {
    return lineNumber;
  }
}