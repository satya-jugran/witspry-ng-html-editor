export interface EditorConfig {
  tabSize: number;
  autoIndent: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;
  fontSize: string;
}

export interface Token {
  type: 'tag' | 'attribute' | 'text' | 'comment' | 'string';
  value: string;
  startIndex: number;
  endIndex: number;
}

export interface Position {
  line: number;
  column: number;
}

export type ThemeType = 'default' | 'light' | 'dark';