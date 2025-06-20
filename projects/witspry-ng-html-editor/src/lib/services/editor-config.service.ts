import { Injectable } from '@angular/core';
import { EditorConfig } from '../interfaces/editor-config.interface';

@Injectable({
  providedIn: 'root'
})
export class EditorConfigService {

  getDefaultConfig(): EditorConfig {
    return {
      tabSize: 2,
      autoIndent: true,
      lineNumbers: true,
      wordWrap: false,
      fontSize: '14px'
    };
  }

  validateConfig(config: EditorConfig): boolean {
    if (!config) return false;
    
    return (
      typeof config.tabSize === 'number' && 
      config.tabSize > 0 && 
      config.tabSize <= 8 &&
      typeof config.autoIndent === 'boolean' &&
      typeof config.lineNumbers === 'boolean' &&
      typeof config.wordWrap === 'boolean' &&
      typeof config.fontSize === 'string' &&
      this.isValidFontSize(config.fontSize)
    );
  }

  mergeWithDefaults(config: Partial<EditorConfig>): EditorConfig {
    const defaultConfig = this.getDefaultConfig();
    return { ...defaultConfig, ...config };
  }

  private isValidFontSize(fontSize: string): boolean {
    // Check if fontSize is a valid CSS font-size value
    const validUnits = ['px', 'em', 'rem', '%', 'pt'];
    return validUnits.some(unit => fontSize.endsWith(unit)) && 
           !isNaN(parseFloat(fontSize));
  }
}