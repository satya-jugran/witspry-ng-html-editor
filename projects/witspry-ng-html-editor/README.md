# Angular HTML Editor

A simple, lightweight HTML editor component for Angular 19+ with syntax highlighting, line numbers, and auto-indentation features.

## Features

- ✅ **HTML Syntax Highlighting** - Real-time syntax highlighting for HTML tags, attributes, and content
- ✅ **Line Numbers** - Optional line numbers with synchronized scrolling
- ✅ **Auto-indentation** - Smart indentation based on HTML structure
- ✅ **Multiple Themes** - Built-in Default, Light, and Dark themes
- ✅ **Configurable** - Customizable tab size, font size, and editor behavior
- ✅ **NgModel Support** - Full two-way data binding with Angular forms
- ✅ **Standalone Component** - No additional dependencies required
- ✅ **TypeScript** - Full TypeScript support with type definitions
- ✅ **Responsive** - Mobile-friendly design
- ✅ **Accessibility** - WCAG compliant with keyboard navigation support

## Installation

```bash
npm install witspry-ng-html-editor
```

## Usage

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { HtmlEditorComponent } from 'witspry-ng-html-editor';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [HtmlEditorComponent],
  template: `
    <witspry-html-editor
      [(ngModel)]="htmlContent"
      placeholder="Enter HTML content...">
    </witspry-html-editor>
  `
})
export class ExampleComponent {
  htmlContent = '<div>Hello World</div>';
}
```

### Advanced Usage

```typescript
import { Component } from '@angular/core';
import { HtmlEditorComponent, EditorConfig, ThemeType } from 'witspry-ng-html-editor';

@Component({
  selector: 'app-advanced',
  standalone: true,
  imports: [HtmlEditorComponent],
  template: `
    <witspry-html-editor
      [(ngModel)]="htmlContent"
      [theme]="currentTheme"
      [config]="editorConfig"
      [readonly]="false"
      placeholder="Enter HTML content..."
      (contentChange)="onContentChange($event)"
      (focus)="onEditorFocus()"
      (blur)="onEditorBlur()">
    </witspry-html-editor>
  `
})
export class AdvancedComponent {
  htmlContent = `<div class="container">
  <h1>Welcome</h1>
  <p>This is a sample HTML content.</p>
</div>`;

  currentTheme: ThemeType = 'dark';
  
  editorConfig: EditorConfig = {
    tabSize: 2,
    autoIndent: true,
    lineNumbers: true,
    wordWrap: false,
    fontSize: '14px'
  };

  onContentChange(content: string): void {
    console.log('Content changed:', content);
  }

  onEditorFocus(): void {
    console.log('Editor focused');
  }

  onEditorBlur(): void {
    console.log('Editor blurred');
  }
}
```

## API Reference

### Component Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `config` | `EditorConfig` | `defaultConfig` | Editor configuration options |
| `theme` | `ThemeType` | `'default'` | Editor theme (`'default'` \| `'light'` \| `'dark'`) |
| `readonly` | `boolean` | `false` | Whether the editor is read-only |
| `placeholder` | `string` | `'Enter HTML content...'` | Placeholder text |

### Component Outputs

| Event | Type | Description |
|-------|------|-------------|
| `contentChange` | `EventEmitter<string>` | Emitted when content changes |
| `focus` | `EventEmitter<void>` | Emitted when editor gains focus |
| `blur` | `EventEmitter<void>` | Emitted when editor loses focus |

### EditorConfig Interface

```typescript
interface EditorConfig {
  tabSize: number;        // Number of spaces for tab (2, 4, or 8)
  autoIndent: boolean;    // Enable auto-indentation
  lineNumbers: boolean;   // Show line numbers
  wordWrap: boolean;      // Enable word wrapping
  fontSize: string;       // Font size (e.g., '14px', '16px')
}
```

### Theme Types

```typescript
type ThemeType = 'default' | 'light' | 'dark';
```

## Styling

The component uses CSS custom properties for theming. You can customize the appearance by overriding these variables:

```css
witspry-html-editor {
  --editor-bg: #ffffff;
  --editor-text: #333333;
  --editor-border: #d1d5db;
  --editor-line-number-bg: #f9fafb;
  --editor-line-number-text: #6b7280;
  --editor-selection: #3b82f6;
  --editor-tag: #dc2626;
  --editor-attribute: #059669;
  --editor-string: #7c3aed;
  --editor-comment: #6b7280;
  --editor-text-content: #374151;
}
```

## Form Integration

The component implements `ControlValueAccessor` and works seamlessly with Angular forms:

### Template-driven Forms

```typescript
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule, HtmlEditorComponent],
  template: `
    <form #form="ngForm">
      <witspry-html-editor
        name="htmlContent"
        [(ngModel)]="htmlContent"
        required>
      </witspry-html-editor>
    </form>
  `
})
export class FormComponent {
  htmlContent = '';
}
```

### Reactive Forms

```typescript
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule, HtmlEditorComponent],
  template: `
    <form [formGroup]="form">
      <witspry-html-editor
        formControlName="htmlContent">
      </witspry-html-editor>
    </form>
  `
})
export class ReactiveFormComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      htmlContent: ['<div>Initial content</div>', Validators.required]
    });
  }
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### 1.0.0
- Initial release
- HTML syntax highlighting
- Line numbers support
- Auto-indentation
- Multiple themes
- NgModel integration
- Standalone component architecture

### 1.0.2
- Syntax highlighting fixes and improvements

### 1.1.0
- Added height as an input parameter.
- Added scrolling if content is larger than height given in input parameter

## 1.1.1
- Fixed word wrap and line number issues