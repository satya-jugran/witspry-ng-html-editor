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
  SimpleChanges,
  ViewEncapsulation,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EditorConfig, ThemeType } from '../../interfaces/editor-config.interface';
import { SyntaxHighlightService } from '../../services/syntax-highlight.service';
import { EditorConfigService } from '../../services/editor-config.service';

@Component({
  selector: 'witspry-html-editor',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="html-editor-container" [attr.data-theme]="theme">
      <div class="html-editor-wrapper" [style.height]="height">
        <!-- Line Numbers -->
        <div
          #lineNumbersContainer
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
            #highlightLayer
            class="html-editor-highlight-layer"
            [style.font-size]="config.fontSize"
            [style.white-space]="config.wordWrap ? 'pre-wrap' : 'pre'"
            [style.word-wrap]="config.wordWrap ? 'break-word' : 'normal'">
          </div>
          
          <!-- Editable Text Area -->
          <textarea
            #editorTextarea
            class="html-editor-textarea"
            [style.font-size]="config.fontSize"
            [style.tab-size]="config.tabSize"
            [style.white-space]="config.wordWrap ? 'pre-wrap' : 'pre'"
            [style.word-wrap]="config.wordWrap ? 'break-word' : 'normal'"
            [style.overflow-x]="config.wordWrap ? 'hidden' : 'auto'"
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
  @Input() height: string = '200px';

  @Output() contentChange = new EventEmitter<string>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  @ViewChild('editorTextarea', { static: false }) editorTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('highlightLayer', { static: false }) highlightLayer!: ElementRef<HTMLDivElement>;
  @ViewChild('lineNumbersContainer', { static: false }) lineNumbersElement!: ElementRef<HTMLDivElement>;

  value: string = '';
  lineNumbers: number[] = [];
  lineHeights: number[] = [];
  private pendingHighlightUpdate = false;
  private resizeObserver?: ResizeObserver;
  
  private onChange = (value: string) => {};
  private onTouched = () => {};
  private isDisabled = false;

  constructor(
    private syntaxHighlightService: SyntaxHighlightService,
    private editorConfigService: EditorConfigService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.config = this.editorConfigService.mergeWithDefaults(this.config);
      
      // If word wrap setting changed, recalculate line heights
      if (changes['config'].previousValue &&
          changes['config'].previousValue.wordWrap !== this.config.wordWrap) {
        setTimeout(() => {
          this.calculateLineHeights();
        }, 0);
      }
    }
    
    if (changes['value'] || changes['config']) {
      this.updateHighlighting();
      this.updateLineNumbers();
    }
  }

  ngAfterViewInit(): void {
    // Ensure highlighting is applied after ViewChild is ready
    if (isPlatformBrowser(this.platformId)) {
      // Use requestAnimationFrame in browser to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.applyInitialHighlighting();
          this.setupResizeObserver();
        }, 50);
      });
    } else {
      // Fallback for SSR
      setTimeout(() => {
        this.applyInitialHighlighting();
      }, 100);
    }
  }

  private applyInitialHighlighting(): void {
    // Force update highlighting for any existing content
    this.updateHighlighting();
    this.updateLineNumbers();
    // Force change detection to ensure the view is updated
    this.cdr.detectChanges();
    
    // If there was a pending highlight update, apply it now
    if (this.pendingHighlightUpdate) {
      this.pendingHighlightUpdate = false;
      this.updateHighlighting();
      this.cdr.detectChanges();
    }
    
    // Force a repaint of the highlight layer to ensure visibility
    this.forceHighlightLayerRepaint();
    
    // Additional delay to ensure everything is rendered
    setTimeout(() => {
      this.forceHighlightLayerRepaint();
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value || '';
    // Try to update highlighting, but mark as pending if ViewChild isn't ready
    if (!this.updateHighlighting()) {
      this.pendingHighlightUpdate = true;
    }
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
    const textarea = event.target as HTMLTextAreaElement;
    
    // Synchronize highlight layer with textarea scroll
    if (this.highlightLayer && this.highlightLayer.nativeElement) {
      this.highlightLayer.nativeElement.scrollTop = textarea.scrollTop;
      this.highlightLayer.nativeElement.scrollLeft = textarea.scrollLeft;
    }
    
    // Synchronize line numbers with textarea scroll
    if (this.lineNumbersElement && this.lineNumbersElement.nativeElement) {
      this.lineNumbersElement.nativeElement.scrollTop = textarea.scrollTop;
    }
  }

  // Helper methods
  private updateHighlighting(): boolean {
    if (this.highlightLayer && this.highlightLayer.nativeElement) {
      const rawHighlightedContent = this.syntaxHighlightService.highlightHtml(this.value);
      // Use direct DOM manipulation to avoid Angular's sanitization
      this.highlightLayer.nativeElement.innerHTML = rawHighlightedContent;
      return true;
    }
    // Return false if ViewChild is not ready yet
    return false;
  }

  private forceHighlightLayerRepaint(): void {
    if (this.highlightLayer && this.highlightLayer.nativeElement) {
      const element = this.highlightLayer.nativeElement;
      // Force a repaint by temporarily changing and restoring a style property
      const originalDisplay = element.style.display;
      element.style.display = 'none';
      // Force a reflow
      element.offsetHeight;
      element.style.display = originalDisplay || '';
      
      // Also ensure the content is properly set
      if (this.value) {
        const rawHighlightedContent = this.syntaxHighlightService.highlightHtml(this.value);
        element.innerHTML = rawHighlightedContent;
      }
    }
  }

  private updateLineNumbers(): void {
    const lines = this.value.split('\n').length;
    this.lineNumbers = Array.from({ length: lines }, (_, i) => i + 1);
    
    // Calculate line heights after DOM update
    setTimeout(() => {
      this.calculateLineHeights();
    }, 0);
  }

  private calculateLineHeights(): void {
    if (!this.editorTextarea?.nativeElement || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const textarea = this.editorTextarea.nativeElement;
    const lines = this.value.split('\n');
    this.lineHeights = [];

    // If word wrap is disabled, all lines have the same height
    if (!this.config.wordWrap) {
      const computedStyle = getComputedStyle(textarea);
      const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.5;
      
      for (let i = 0; i < lines.length; i++) {
        this.lineHeights.push(lineHeight);
      }
      
      this.updateLineNumberHeights();
      return;
    }

    // For word wrap enabled, calculate dynamic heights
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.height = 'auto';
    tempDiv.style.width = textarea.clientWidth - 24 + 'px'; // Account for padding
    tempDiv.style.padding = '0';
    tempDiv.style.margin = '0';
    tempDiv.style.border = 'none';
    tempDiv.style.fontFamily = getComputedStyle(textarea).fontFamily;
    tempDiv.style.fontSize = getComputedStyle(textarea).fontSize;
    tempDiv.style.lineHeight = getComputedStyle(textarea).lineHeight;
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.style.wordWrap = 'break-word';
    tempDiv.style.overflow = 'hidden';

    document.body.appendChild(tempDiv);

    try {
      for (let i = 0; i < lines.length; i++) {
        const lineContent = lines[i] || ' '; // Use space for empty lines
        tempDiv.textContent = lineContent;
        const height = tempDiv.offsetHeight;
        this.lineHeights.push(height);
      }
    } finally {
      document.body.removeChild(tempDiv);
    }

    // Update line number container heights
    this.updateLineNumberHeights();
  }

  private updateLineNumberHeights(): void {
    if (!this.lineNumbersElement?.nativeElement || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const lineNumberElements = this.lineNumbersElement.nativeElement.querySelectorAll('.html-editor-line-number');
    
    lineNumberElements.forEach((element: Element, index: number) => {
      if (this.lineHeights[index]) {
        (element as HTMLElement).style.height = this.lineHeights[index] + 'px';
        (element as HTMLElement).style.minHeight = this.lineHeights[index] + 'px';
      }
    });
  }

  private setupResizeObserver(): void {
    if (!isPlatformBrowser(this.platformId) || !this.editorTextarea?.nativeElement) {
      return;
    }

    // Create ResizeObserver to watch for textarea size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Debounce the recalculation to avoid excessive calls
        setTimeout(() => {
          this.calculateLineHeights();
        }, 100);
      }
    });

    // Observe the textarea for size changes
    this.resizeObserver.observe(this.editorTextarea.nativeElement);
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