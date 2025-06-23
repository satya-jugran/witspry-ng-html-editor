import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HtmlEditorComponent } from '../../../witspry-ng-html-editor/src/lib/components/html-editor/html-editor.component';
import { EditorConfig, ThemeType } from '../../../witspry-ng-html-editor/src/lib/interfaces/editor-config.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HtmlEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'HTML Editor Demo';
  
  htmlContent = `<div class="container">
  <h1>Welcome to HTML Editor</h1>
  <p>This is a sample HTML content with <strong>bold text</strong> and <em>italic text</em>.</p>
  <!-- This is a comment -->
  <section class="additional-content">
    <h2>More Content</h2>
    <p>Additional content to test scrolling functionality.</p>
    <ul>
      <li>First item</li>
      <li>Second item</li>
      <li>Third item</li>
      <li>Fourth item</li>
      <li>Fifth item</li>
    </ul>
    <div class="nested">
      <h3>Nested Section</h3>
      <p>Footer content with <span style="color:green;">styled text</span></p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
        <li>Item 4</li>
      </ul>
    </div>
  </section>
</div>`;

  editorConfig: EditorConfig = {
    tabSize: 2,
    autoIndent: true,
    lineNumbers: true,
    wordWrap: false,
    fontSize: '14px'
  };

  currentTheme: ThemeType = 'dark';
  readonly = false;
  editorHeight = '300px';

  themes: { value: ThemeType; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
  ];

  constructor(private sanitizer: DomSanitizer) {}

  get safeHtmlContent(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.htmlContent);
  }

  onContentChange(content: string): void {
    console.log('Content changed:', content);
  }

  onEditorFocus(): void {
    console.log('Editor focused');
  }

  onEditorBlur(): void {
    console.log('Editor blurred');
  }

  toggleReadonly(): void {
    this.readonly = !this.readonly;
  }

  changeTheme(theme: ThemeType): void {
    this.currentTheme = theme;
  }

  updateTabSize(size: number): void {
    this.editorConfig = { ...this.editorConfig, tabSize: size };
  }

  toggleLineNumbers(): void {
    this.editorConfig = { ...this.editorConfig, lineNumbers: !this.editorConfig.lineNumbers };
  }

  toggleAutoIndent(): void {
    this.editorConfig = { ...this.editorConfig, autoIndent: !this.editorConfig.autoIndent };
  }

  toggleWordWrap(): void {
    this.editorConfig = { ...this.editorConfig, wordWrap: !this.editorConfig.wordWrap };
  }

  changeFontSize(size: string): void {
    this.editorConfig = { ...this.editorConfig, fontSize: size };
  }

  changeHeight(height: string): void {
    this.editorHeight = height;
  }
}
