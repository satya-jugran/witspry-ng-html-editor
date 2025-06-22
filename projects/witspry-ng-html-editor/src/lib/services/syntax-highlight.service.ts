import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Token } from '../interfaces/editor-config.interface';

@Injectable({
  providedIn: 'root'
})
export class SyntaxHighlightService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  highlightHtml(content: string): string {
    if (!content) return '';
    
    const tokens = this.tokenizeHtml(content);
    return this.applyHighlighting(tokens, content);
  }

  private tokenizeHtml(content: string): Token[] {
    const tokens: Token[] = [];
    let index = 0;

    while (index < content.length) {
      // HTML Comments
      if (content.substring(index, index + 4) === '<!--') {
        const endIndex = content.indexOf('-->', index);
        if (endIndex !== -1) {
          tokens.push({
            type: 'comment',
            value: content.substring(index, endIndex + 3),
            startIndex: index,
            endIndex: endIndex + 3
          });
          index = endIndex + 3;
          continue;
        }
      }

      // HTML Tags
      if (content[index] === '<') {
        const tagEndIndex = content.indexOf('>', index);
        if (tagEndIndex !== -1) {
          const tagContent = content.substring(index, tagEndIndex + 1);
          
          // Parse tag and attributes
          const tagMatch = tagContent.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
          if (tagMatch) {
            let currentIndex = index;
            
            // Opening bracket and tag name
            tokens.push({
              type: 'tag',
              value: tagMatch[0],
              startIndex: currentIndex,
              endIndex: currentIndex + tagMatch[0].length
            });
            currentIndex += tagMatch[0].length;

            // Parse attributes
            const attributeRegex = /\s+([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/g;
            let attrMatch;

            while ((attrMatch = attributeRegex.exec(tagContent)) !== null) {
              const attrStartIndex = index + attrMatch.index;
              
              // Attribute name
              tokens.push({
                type: 'attribute',
                value: attrMatch[1],
                startIndex: attrStartIndex + attrMatch[0].indexOf(attrMatch[1]),
                endIndex: attrStartIndex + attrMatch[0].indexOf(attrMatch[1]) + attrMatch[1].length
              });

              // Attribute value
              tokens.push({
                type: 'string',
                value: attrMatch[2],
                startIndex: attrStartIndex + attrMatch[0].indexOf(attrMatch[2]),
                endIndex: attrStartIndex + attrMatch[0].indexOf(attrMatch[2]) + attrMatch[2].length
              });
            }
            
            // Closing bracket
            tokens.push({
              type: 'tag',
              value: '>',
              startIndex: tagEndIndex,
              endIndex: tagEndIndex + 1
            });
          }

          index = tagEndIndex + 1;
          continue;
        }
      }

      // Text content
      const nextTagIndex = content.indexOf('<', index);
      const textEnd = nextTagIndex === -1 ? content.length : nextTagIndex;
      
      if (textEnd > index) {
        const textContent = content.substring(index, textEnd);
        if (textContent.trim()) {
          tokens.push({
            type: 'text',
            value: textContent,
            startIndex: index,
            endIndex: textEnd
          });
        }
        index = textEnd;
      } else {
        index++;
      }
    }

    return tokens;
  }

  private applyHighlighting(tokens: Token[], originalContent: string): string {
    let result = '';
    let lastIndex = 0;

    // Sort tokens by start index
    tokens.sort((a, b) => a.startIndex - b.startIndex);

    for (const token of tokens) {
      // Add any content between tokens
      if (token.startIndex > lastIndex) {
        result += this.escapeHtmlPreservingContent(originalContent.substring(lastIndex, token.startIndex));
      }

      // Add highlighted token
      const escapedValue = this.escapeHtmlPreservingContent(token.value);
      result += `<span class="html-editor-${token.type}">${escapedValue}</span>`;
      
      lastIndex = token.endIndex;
    }

    // Add remaining content
    if (lastIndex < originalContent.length) {
      result += this.escapeHtmlPreservingContent(originalContent.substring(lastIndex));
    }

    return result;
  }

  private escapeHtml(text: string): string {
    if (isPlatformBrowser(this.platformId)) {
      // Use DOM method in browser
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    } else {
      // Manual escaping for SSR
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }

  private escapeHtmlPreservingContent(text: string): string {
    // For syntax highlighting, we need to escape HTML properly to prevent it from being interpreted
    // but we want to preserve the original content structure for display
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}