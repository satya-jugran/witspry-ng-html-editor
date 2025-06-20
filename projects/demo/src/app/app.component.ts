import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  <ul>
    <li>First item</li>
    <li>Second item</li>
  </ul>
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

  themes: { value: ThemeType; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
  ];

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
}
