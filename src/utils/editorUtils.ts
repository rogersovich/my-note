export function insertMarkdownSyntax(
  currentText: string,
  syntax: string,
  selectionStart: number = 0,
  selectionEnd: number = 0
): { newText: string; newCursorPos: number } {
  const selectedText = currentText.slice(selectionStart, selectionEnd);
  let replacement = '';
  let cursorOffset = 0;

  switch (syntax) {
    case 'h1':
      replacement = `# ${selectedText || 'Heading 1'}`;
      cursorOffset = replacement.length;
      break;
    case 'h2':
      replacement = `## ${selectedText || 'Heading 2'}`;
      cursorOffset = replacement.length;
      break;
    case 'h3':
      replacement = `### ${selectedText || 'Heading 3'}`;
      cursorOffset = replacement.length;
      break;
    case 'bold':
      replacement = `**${selectedText || 'bold text'}**`;
      cursorOffset = selectedText ? replacement.length : 2;
      break;
    case 'italic':
      replacement = `*${selectedText || 'italic text'}*`;
      cursorOffset = selectedText ? replacement.length : 1;
      break;
    case 'strike':
      replacement = `~~${selectedText || 'strikethrough'}~~`;
      cursorOffset = selectedText ? replacement.length : 2;
      break;
    case 'code':
      replacement = `\`${selectedText || 'code'}\``;
      cursorOffset = selectedText ? replacement.length : 1;
      break;
    case 'codeblock':
      replacement = `\n\`\`\`javascript\n${selectedText || '// code here'}\n\`\`\`\n`;
      cursorOffset = replacement.length - 5;
      break;
    case 'quote':
      replacement = `\n> ${selectedText || 'Quote here'}\n`;
      cursorOffset = replacement.length - 1;
      break;
    case 'bullet':
      replacement = `\n- ${selectedText || 'List item'}`;
      cursorOffset = replacement.length;
      break;
    case 'number':
      replacement = `\n1. ${selectedText || 'First item'}`;
      cursorOffset = replacement.length;
      break;
    case 'task':
      replacement = `\n- [ ] ${selectedText || 'New task'}`;
      cursorOffset = replacement.length;
      break;
    case 'link':
      replacement = `[${selectedText || 'link text'}](https://example.com)`;
      cursorOffset = replacement.length - 1;
      break;
    case 'image':
      replacement = `![${selectedText || 'Image description'}](https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800)`;
      cursorOffset = replacement.length;
      break;
    case 'table':
      replacement = `\n| Column 1 | Column 2 | Column 3 |\n| :--- | :---: | ---: |\n| Item 1 | Details | $10.00 |\n| Item 2 | Details | $20.00 |\n`;
      cursorOffset = replacement.length;
      break;
    case 'math':
      replacement = `\n$$\n${selectedText || 'E = mc^2'}\n$$\n`;
      cursorOffset = replacement.length - 4;
      break;
    default:
      replacement = selectedText;
      cursorOffset = replacement.length;
  }

  const newText =
    currentText.slice(0, selectionStart) +
    replacement +
    currentText.slice(selectionEnd);
  const newCursorPos = selectionStart + cursorOffset;

  return { newText, newCursorPos };
}

export function countWordsAndChars(text: string) {
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
  return { chars, words, lines, readTimeMinutes };
}
