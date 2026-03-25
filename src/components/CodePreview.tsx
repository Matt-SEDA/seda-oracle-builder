'use client';

import { useState, useMemo } from 'react';

interface Token {
  type: string;
  text: string;
}

const RUST_KEYWORDS = new Set([
  'fn', 'let', 'mut', 'const', 'pub', 'use', 'mod', 'struct', 'impl', 'enum',
  'match', 'if', 'else', 'for', 'while', 'loop', 'return', 'break', 'continue',
  'as', 'in', 'where', 'async', 'await', 'move', 'ref', 'self', 'super', 'crate',
  'true', 'false', 'Some', 'None', 'Ok', 'Err', 'Self',
]);

const RUST_TYPES = new Set([
  'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'i8', 'i16', 'i32', 'i64', 'i128', 'isize',
  'f32', 'f64', 'bool', 'char', 'str', 'String',
  'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc',
]);

function tokenizeRust(code: string): Token[][] {
  const lines = code.split('\n');
  return lines.map(line => {
    const tokens: Token[] = [];
    let i = 0;

    while (i < line.length) {
      // Comments
      if (line[i] === '/' && line[i + 1] === '/') {
        tokens.push({ type: 'comment', text: line.slice(i) });
        break;
      }

      // Strings
      if (line[i] === '"') {
        let j = i + 1;
        while (j < line.length && (line[j] !== '"' || line[j - 1] === '\\')) j++;
        tokens.push({ type: 'string', text: line.slice(i, j + 1) });
        i = j + 1;
        continue;
      }

      // Macros (word!)
      if (/[a-z]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
        const word = line.slice(i, j);
        if (line[j] === '!') {
          tokens.push({ type: 'macro', text: word + '!' });
          i = j + 1;
          continue;
        }
        if (RUST_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword', text: word });
        } else if (RUST_TYPES.has(word)) {
          tokens.push({ type: 'type', text: word });
        } else if (line[j] === '(') {
          tokens.push({ type: 'function', text: word });
        } else {
          tokens.push({ type: 'plain', text: word });
        }
        i = j;
        continue;
      }

      // Types starting with uppercase
      if (/[A-Z]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
        const word = line.slice(i, j);
        if (RUST_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword', text: word });
        } else if (RUST_TYPES.has(word)) {
          tokens.push({ type: 'type', text: word });
        } else {
          tokens.push({ type: 'type', text: word });
        }
        i = j;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[0-9a-fA-Fx._]/.test(line[j])) j++;
        tokens.push({ type: 'number', text: line.slice(i, j) });
        i = j;
        continue;
      }

      // Lifetimes
      if (line[i] === '\'' && /[a-z]/.test(line[i + 1] || '')) {
        let j = i + 1;
        while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
        tokens.push({ type: 'lifetime', text: line.slice(i, j) });
        i = j;
        continue;
      }

      // Operators
      if (/[=<>!&|+\-*/%^~?]/.test(line[i])) {
        tokens.push({ type: 'operator', text: line[i] });
        i++;
        continue;
      }

      // Attribute macros (#[...])
      if (line[i] === '#' && line[i + 1] === '[') {
        let j = i;
        let depth = 0;
        while (j < line.length) {
          if (line[j] === '[') depth++;
          if (line[j] === ']') { depth--; if (depth === 0) { j++; break; } }
          j++;
        }
        tokens.push({ type: 'macro', text: line.slice(i, j) });
        i = j;
        continue;
      }

      // Everything else (whitespace, punctuation)
      tokens.push({ type: 'plain', text: line[i] });
      i++;
    }

    return tokens;
  });
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

interface Props {
  code: string;
  language?: string;
}

export default function CodePreview({ code, language = 'rust' }: Props) {
  const [copied, setCopied] = useState(false);

  const tokenized = useMemo(() => tokenizeRust(code), [code]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-preview">
      <div className="code-preview__header">
        <span className="code-preview__lang">{language}</span>
        <button className="code-preview__copy" onClick={handleCopy}>
          <CopyIcon />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="code-preview__body">
        {tokenized.map((lineTokens, lineIdx) => (
          <div key={lineIdx} className="code-preview__line">
            <span className="code-preview__line-num">{lineIdx + 1}</span>
            {lineTokens.length === 0 ? (
              <span>{'\n'}</span>
            ) : (
              lineTokens.map((token, tokenIdx) => (
                <span key={tokenIdx} className={token.type !== 'plain' ? `tk-${token.type}` : undefined}>
                  {token.text}
                </span>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
