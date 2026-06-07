#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load configurations
const secretsRcPath = path.join(rootDir, '.secretsrc');
let config = { rules: [], exclude: { files: [], paths: [] } };

if (fs.existsSync(secretsRcPath)) {
  try {
    config = JSON.parse(fs.readFileSync(secretsRcPath, 'utf8'));
  } catch (e) {
    console.error('[-] Failed to parse .secretsrc:', e.message);
    process.exit(1);
  }
}

// Compile exclusion rules
const excludeFilesRegexes = (config.exclude?.files || []).map(p => new RegExp(p));
const excludePaths = config.exclude?.paths || [];

// Additional default exclusions to protect template files and binary assets
const defaultExcludeExtensions = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.pdf', '.zip', '.gz', '.tar',
  '.woff', '.woff2', '.eot', '.ttf', '.mp4', '.mov', '.mp3', '.wav', '.lock',
  '.example', // Exclude env template files like .env.example
  '.md', // Exclude documentation markdown files
];

// Placeholders and common false positives we ignore
const PLACEHOLDER_PATTERNS = [
  /your_/i,
  /placeholder/i,
  /example/i,
  /dummy/i,
  /mock/i,
  /key_here/i,
  /secret_here/i,
  /token_here/i,
];

function isPlaceholder(value) {
  return PLACEHOLDER_PATTERNS.some(regex => regex.test(value));
}

// Check if a file should be excluded
function shouldExclude(filePath) {
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');

  // Check extensions
  const ext = path.extname(filePath).toLowerCase();
  if (defaultExcludeExtensions.includes(ext)) {
    return true;
  }

  // Check .secretsrc file exclusions
  for (const regex of excludeFilesRegexes) {
    if (regex.test(relativePath)) {
      return true;
    }
  }

  // Check .secretsrc path exclusions
  for (const p of excludePaths) {
    if (relativePath.split('/').includes(p)) {
      return true;
    }
  }

  // Also skip template files
  if (relativePath.endsWith('.example')) {
    return true;
  }

  return false;
}

// Shannon Entropy Calculation
function calculateEntropy(str) {
  const len = str.length;
  if (len === 0) return 0;
  const frequencies = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// Parse regex from config (handles (?i) PCRE flag)
function parseRegex(patternStr) {
  let flags = 'g';
  let pattern = patternStr;
  if (pattern.startsWith('(?i)')) {
    pattern = pattern.substring(4);
    flags += 'i';
  }
  pattern = pattern.replace(/\\s/g, '\\s');
  return new RegExp(pattern, flags);
}

// Check if a regex match is a false positive
function isRegexMatchFalsePositive(matchedText) {
  // If the matched text contains template string interpolations, skip
  if (matchedText.includes('${') || matchedText.includes('}')) {
    return true;
  }

  // Split by first colon or equals to inspect RHS
  const parts = matchedText.split(/[:=]/);
  if (parts.length < 2) return true;
  const rhs = parts.slice(1).join('=').trim();
  
  if (!rhs) return true;
  
  // Extract a fully enclosed quoted string literal from the RHS
  const matchQuote = rhs.match(/(["'`])((?:\\.|[^\1])*?)\1/);
  if (!matchQuote) {
    return true; // No valid quoted string in RHS, likely code/expression
  }
  
  const secretVal = matchQuote[2];
  if (secretVal.length < 8) {
    return true; // Too short to be a secret key
  }

  // Ignore all uppercase env variable names (like FCM_PRIVATE_KEY or VAPID_PRIVATE_KEY)
  if (secretVal === secretVal.toUpperCase() && !/[0-9]/.test(secretVal)) {
    return true;
  }
  
  // If the extracted value contains env variable lookups, function calls, imports, or standard definitions
  const safeKeywords = [
    'deno.env', 'process.env', 'import.meta.env', 'split', 'header', 'string',
    'undefined', 'null', 'c.req', 'get', 'function', 'const', 'let', 'var',
    'true', 'false', 'require', 'import', 'export', 'as', 'type', 'interface',
    'token:{', 'token:${', 'authorization', 'bearer'
  ];
  
  const valLower = secretVal.toLowerCase();
  if (safeKeywords.some(keyword => valLower.includes(keyword))) {
    return true;
  }
  
  // If RHS is just a path or API route
  if (secretVal.startsWith('/')) {
    return true;
  }

  // If RHS is a placeholder
  if (isPlaceholder(secretVal)) {
    return true;
  }

  return false;
}

// Check if a string literal token is a false positive for an entropy check
function isEntropyFalsePositive(token, lineContent) {
  // If it has no digits (purely alphabetical, e.g. camelCase variable names like offersNotificationDismissedAt)
  if (!/[0-9]/.test(token)) {
    return true;
  }

  // If it's a URL path or file path
  if (token.startsWith('/') || token.includes('/') || token.includes('\\')) {
    return true;
  }
  
  // Mime types
  if (token.includes('application/') || token.includes('text/') || token.includes('image/')) {
    return true;
  }

  // Spaces (English sentences / text)
  if (token.includes(' ')) {
    return true;
  }

  // Common email addresses (like test/admin emails in test mock roles)
  if (token.includes('@')) {
    return true;
  }

  // CSS classes / tailwind
  if (lineContent.includes('className=') || lineContent.includes('class=')) {
    return true;
  }

  // All uppercase (env var name like SUPABASE_SERVICE_ROLE_KEY)
  if (token === token.toUpperCase() && !/[0-9]/.test(token)) {
    return true;
  }

  // Simple camelCase or snake_case identifier (like figma-asset-resolver, kv_store_549f93eb)
  if (/^[a-z_0-9-]+$/i.test(token)) {
    if (token.toLowerCase() === token || token.toUpperCase() === token) {
      return true;
    }
  }

  // Template string dynamic interpolation (like ${user.id} or ${enc(header)})
  if (token.includes('${') || token.includes('}')) {
    return true;
  }

  // Method calls or object properties inside string literals
  if (token.includes('(') || token.includes(')') || token.includes('[') || token.includes(']') || token.includes('.') || token.includes(',')) {
    return true;
  }

  // URL query strings / query variables
  if (token.includes('%') || token.includes('&') || token.includes('=')) {
    return true;
  }

  // KV namespace prefixes (like "push_subscription:", "coupon:", "user:", "notifications:")
  if (token.includes(':') && (token.endsWith(':') || token.length < 32)) {
    return true;
  }

  return false;
}

// Scan file contents
function scanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const findings = [];

  // 1. Check regex rules
  for (const rule of config.rules || []) {
    if (rule.type !== 'regex') continue;

    const regex = parseRegex(rule.pattern);
    lines.forEach((line, index) => {
      // Skip console logs
      if (line.includes('console.log') || line.includes('console.error') || line.includes('console.warn')) {
        return;
      }

      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        const matchedText = match[0];
        
        if (isRegexMatchFalsePositive(matchedText)) {
          continue;
        }
        
        findings.push({
          line: index + 1,
          rule: rule.message,
          match: matchedText.trim(),
          content: line.trim()
        });
      }
    });
  }

  // 2. Check entropy rule (for high entropy string literals)
  const entropyRule = (config.rules || []).find(r => r.type === 'entropy');
  if (entropyRule) {
    const threshold = parseFloat(entropyRule.threshold) || 3.5;
    const ext = path.extname(filePath).toLowerCase();
    
    // Only check source code files for entropy (exclude markdown, css, html, json)
    const sourceExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.sh', '.yml', '.yaml'];
    
    if (sourceExtensions.includes(ext)) {
      lines.forEach((line, index) => {
        // Skip comment lines or console logs
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
          return;
        }
        if (trimmed.includes('console.log') || trimmed.includes('console.error') || trimmed.includes('console.warn')) {
          return;
        }

        // Find string literals inside quotes
        const stringLiteralRegex = /(["'`])((?:\\.|[^\1])*?)\1/g;
        let match;
        
        while ((match = stringLiteralRegex.exec(line)) !== null) {
          const literalVal = match[2];
          
          if (!literalVal || literalVal.length < 16 || literalVal.length > 128) {
            continue;
          }

          if (isPlaceholder(literalVal) || isEntropyFalsePositive(literalVal, line)) {
            continue;
          }

          const entropy = calculateEntropy(literalVal);
          if (entropy > threshold) {
            const uniqueChars = new Set(literalVal).size;
            if (uniqueChars > 8) {
              findings.push({
                line: index + 1,
                rule: `${entropyRule.message} (Entropy: ${entropy.toFixed(2)})`,
                match: literalVal,
                content: line.trim()
              });
            }
          }
        }
      });
    }
  }

  return findings;
}

function main() {
  const args = process.argv.slice(2);
  const scanStagedOnly = args.includes('--staged');
  let filesToScan = [];

  console.log(`[+] Running Security Scan... (${scanStagedOnly ? 'Staged files only' : 'All tracked files'})`);

  try {
    if (scanStagedOnly) {
      const stdout = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
      filesToScan = stdout.split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)
        .map(f => path.join(rootDir, f));
    } else {
      const stdout = execSync('git ls-files', { encoding: 'utf8' });
      filesToScan = stdout.split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)
        .map(f => path.join(rootDir, f));
    }
  } catch (e) {
    console.error('[-] Git command failed. Are you in a git repository?', e.message);
    process.exit(1);
  }

  let totalFindings = 0;

  for (const file of filesToScan) {
    if (!fs.existsSync(file) || shouldExclude(file)) {
      continue;
    }

    const findings = scanFile(file);
    if (findings.length > 0) {
      const relativePath = path.relative(rootDir, file);
      console.log(`\n[!] Security issue detected in: ${relativePath}`);
      findings.forEach(f => {
        console.log(`    Line ${f.line}: ${f.rule}`);
        console.log(`    Matched: "${f.match}"`);
        console.log(`    Context: ${f.content}`);
      });
      totalFindings += findings.length;
    }
  }

  console.log('\n--------------------------------------------------');
  if (totalFindings > 0) {
    console.error(`[-] Scan failed: ${totalFindings} potential secret(s) / credential(s) detected!`);
    console.error(`[!] Action Required: Remove these secrets before committing. Use environment variables instead.`);
    process.exit(1);
  } else {
    console.log('[+] Security scan passed! No secrets found.');
    process.exit(0);
  }
}

main();
