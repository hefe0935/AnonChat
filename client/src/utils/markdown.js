/**
 * Markdown Support Utilities
 * 
 * Converts markdown to HTML for chat messages
 */

const MARKDOWN_PATTERNS = {
  bold: /\*\*(.*?)\*\*/g,
  italic: /\*(.*?)\*/g,
  code: /`(.*?)`/g,
  codeBlock: /```([\s\S]*?)```/g,
  strikethrough: /~~(.*?)~~/g,
  underline: /__([^_]+)__/g,
  link: /\[(.*?)\]\((.*?)\)/g, // Disabled by default
  heading: /^### (.*?)$/gm,
  hr: /^---$/gm,
};

class MarkdownParser {
  constructor(options = {}) {
    this.enableLinks = options.enableLinks || false; // Links disabled by privacy
    this.enableHeadings = options.enableHeadings || true;
    this.enableHR = options.enableHR || false;
  }

  /**
   * Parse markdown and return HTML
   */
  parse(text) {
    if (!text) return '';

    let html = this.escapeHTML(text);

    // Order matters! Do these in the right order
    html = this.parseCodeBlocks(html);
    html = this.parseInlineCode(html);
    html = this.parseBold(html);
    html = this.parseItalic(html);
    html = this.parseStrikethrough(html);
    html = this.parseUnderline(html);
    
    if (this.enableHeadings) {
      html = this.parseHeadings(html);
    }

    if (this.enableLinks) {
      html = this.parseLinks(html);
    }

    return html;
  }

  /**
   * Escape HTML to prevent injection
   */
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Parse code blocks
   */
  parseCodeBlocks(text) {
    return text.replace(MARKDOWN_PATTERNS.codeBlock, (match, code) => {
      const escapedCode = code.trim();
      return `<pre><code>${escapedCode}</code></pre>`;
    });
  }

  /**
   * Parse inline code
   */
  parseInlineCode(text) {
    return text.replace(MARKDOWN_PATTERNS.code, (match, code) => {
      return `<code class="inline-code">${code}</code>`;
    });
  }

  /**
   * Parse bold
   */
  parseBold(text) {
    return text.replace(MARKDOWN_PATTERNS.bold, (match, content) => {
      return `<strong>${content}</strong>`;
    });
  }

  /**
   * Parse italic
   */
  parseItalic(text) {
    return text.replace(MARKDOWN_PATTERNS.italic, (match, content) => {
      return `<em>${content}</em>`;
    });
  }

  /**
   * Parse strikethrough
   */
  parseStrikethrough(text) {
    return text.replace(MARKDOWN_PATTERNS.strikethrough, (match, content) => {
      return `<del>${content}</del>`;
    });
  }

  /**
   * Parse underline
   */
  parseUnderline(text) {
    return text.replace(MARKDOWN_PATTERNS.underline, (match, content) => {
      return `<u>${content}</u>`;
    });
  }

  /**
   * Parse links (disabled by default for privacy)
   */
  parseLinks(text) {
    if (!this.enableLinks) return text;

    return text.replace(MARKDOWN_PATTERNS.link, (match, title, url) => {
      // Only allow safe protocols
      const safeUrl = url.startsWith('http://') || url.startsWith('https://')
        ? url
        : '#';
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${title}</a>`;
    });
  }

  /**
   * Parse headings
   */
  parseHeadings(text) {
    return text.replace(MARKDOWN_PATTERNS.heading, (match, content) => {
      return `<h3>${content}</h3>`;
    });
  }

  /**
   * Check if text contains markdown
   */
  hasMarkdown(text) {
    return Object.values(MARKDOWN_PATTERNS).some(pattern => pattern.test(text));
  }

  /**
   * Get preview (first 100 chars)
   */
  getPreview(text) {
    // Remove markdown syntax for preview
    let preview = text
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/\n/g, ' ')
      .substring(0, 100);

    return preview + (preview.length === 100 ? '...' : '');
  }
}

export const markdownParser = new MarkdownParser({
  enableLinks: false,
  enableHeadings: true
});
