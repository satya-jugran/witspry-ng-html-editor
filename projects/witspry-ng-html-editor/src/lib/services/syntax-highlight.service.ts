import { Injectable } from '@angular/core';
import { Token } from '../interfaces/editor-config.interface';

@Injectable({
  providedIn: 'root'
})
export class SyntaxHighlightService {

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
            // Tag name
            tokens.push({
              type: 'tag',
              value: tagMatch[0],
              startIndex: index,
              endIndex: index + tagMatch[0].length
            });

            // Parse attributes
            const attributeRegex = /\s+([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/g;
            let attrMatch;
            let lastIndex = index + tagMatch[0].length;

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
        result += this.escapeHtml(originalContent.substring(lastIndex, token.startIndex));
      }

      // Add highlighted token
      const escapedValue = this.escapeHtml(token.value);
      result += `<span class="html-editor-${token.type}">${escapedValue}</span>`;
      
      lastIndex = token.endIndex;
    }

    // Add remaining content
    if (lastIndex < originalContent.length) {
      result += this.escapeHtml(originalContent.substring(lastIndex));
    }

    return result;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}