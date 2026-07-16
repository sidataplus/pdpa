/** @jsxImportSource theme-ui */
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, Flex, Input, Text, Spinner } from 'theme-ui';
import {
  SEARCH_SNIPPET_CONTEXT,
  SEARCH_MAX_RESULTS,
  SEARCH_TITLE_SCORE,
  SEARCH_TEXT_SCORE,
} from '../lib/constants';

// Maps Arabic digits ↔ Thai digits so "มาตรา 1" matches "มาตรา ๑" and vice versa.
const DIGIT_MAP = {
  '0': '[0๐]', '๐': '[0๐]', '1': '[1๑]', '๑': '[1๑]',
  '2': '[2๒]', '๒': '[2๒]', '3': '[3๓]', '๓': '[3๓]',
  '4': '[4๔]', '๔': '[4๔]', '5': '[5๕]', '๕': '[5๕]',
  '6': '[6๖]', '๖': '[6๖]', '7': '[7๗]', '๗': '[7๗]',
  '8': '[8๘]', '๘': '[8๘]', '9': '[9๙]', '๙': '[9๙]',
};

/**
 * Convert a raw search query into a regex pattern that:
 *  - Allows optional whitespace between words
 *  - Matches both Arabic (1–9) and Thai (๑–๙) digits interchangeably
 *
 * @param {string} q - Raw user input.
 * @returns {string} Safe regex pattern string.
 */
function buildSearchRegexStr(q) {
  // Escape special regex characters first to prevent ReDoS
  let escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Allow optional spaces between words
  escaped = escaped.replace(/\s+/g, '\\s*');
  // Allow optional space between text and digits (e.g. "มาตรา1" → "มาตรา 1")
  escaped = escaped.replace(/([^0-9๐-๙\s\\])(?=[0-9๐-๙])/g, '$1\\s*');
  escaped = escaped.replace(/([0-9๐-๙])(?=[^0-9๐-๙\s\\])/g, '$1\\s*');
  // Replace each digit with a character class matching both script equivalents
  return escaped.replace(/[0-9๐-๙]/g, (match) => DIGIT_MAP[match] || match);
}

/**
 * Split `text` into alternating [non-match, match, non-match, ...] segments
 * based on `regex` so we can render match spans without dangerouslySetInnerHTML.
 *
 * @param {string} text
 * @param {RegExp} regex
 * @returns {Array<{text: string, highlight: boolean}>}
 */
function splitHighlight(text, regex) {
  const parts = [];
  let lastIndex = 0;
  const re = new RegExp(regex.source, 'gi');
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlight: false });
    }
    parts.push({ text: match[0], highlight: true });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }
  return parts.length > 0 ? parts : [{ text, highlight: false }];
}

/**
 * Render `text` with matched segments wrapped in a highlighted <Box as="mark">.
 * Safe alternative to dangerouslySetInnerHTML.
 */
function HighlightedText({ text, regex, sx: sxProp }) {
  if (!regex || !text) return <Text sx={sxProp}>{text}</Text>;
  const parts = splitHighlight(text, regex);
  return (
    <Text sx={sxProp}>
      {parts.map((part, i) =>
        part.highlight ? (
          <Box
            key={i}
            as="mark"
            sx={{ bg: 'transparent', color: 'primary', fontWeight: 'bold' }}
          >
            {part.text}
          </Box>
        ) : (
          part.text
        )
      )}
    </Text>
  );
}

/**
 * Inline search box that expands into a dropdown results panel.
 * Opened by clicking the input or pressing Ctrl+K / Cmd+K.
 *
 * @param {Object}   props
 * @param {Function} props.navigateToStackedPage - Opens a note in the stacked-page view.
 */
export default function SearchModal({ navigateToStackedPage }) {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [indexData, setIndexData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceTimer = useRef(null);

  // --- Memoised regex (only recomputed when the query string changes) ---
  const regexStr = useMemo(() => (query ? buildSearchRegexStr(query) : ''), [query]);
  const testRegex = useMemo(() => (regexStr ? new RegExp(regexStr, 'i') : null), [regexStr]);

  // --- Lazy-load the search index once on first open ---
  useEffect(() => {
    if (!isOpen || indexData || loading) return;
    setLoading(true);
    setFetchError(null);
    const isDev = process.env.NODE_ENV === 'development';
    fetch(`/search-index.json${isDev ? `?t=${Date.now()}` : ''}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setIndexData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Search index fetch failed:', err);
        setFetchError('โหลดข้อมูลค้นหาไม่สำเร็จ กรุณาลองใหม่');
        setLoading(false);
      });
  }, [isOpen, indexData, loading]);

  // --- Prefill from ?q= (deep link support for the WebSite SearchAction schema) ---
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      setInputValue(q);
      setQuery(q);
      setIsOpen(true);
    }
  }, []);

  // --- Open with Ctrl+K / Cmd+K ---
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // --- Build grouped results whenever query or index data changes ---
  useEffect(() => {
    if (!query || !indexData || !testRegex) {
      setResults([]);
      return;
    }

    const matches = indexData
      .map((item) => {
        let score = 0;
        const titleMatch = testRegex.test(item.title);
        const textMatch = testRegex.test(item.text);

        if (titleMatch) score += SEARCH_TITLE_SCORE;
        if (textMatch) score += SEARCH_TEXT_SCORE;
        if (score === 0) return null;

        let snippet = '';
        if (textMatch) {
          const matchIndex = item.text.search(testRegex);
          const start = Math.max(0, matchIndex - SEARCH_SNIPPET_CONTEXT);
          const end = Math.min(item.text.length, matchIndex + query.length + SEARCH_SNIPPET_CONTEXT);
          snippet =
            (start > 0 ? '…' : '') +
            item.text.substring(start, end) +
            (end < item.text.length ? '…' : '');
        }
        return { ...item, score, snippet };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, SEARCH_MAX_RESULTS);

    // Group results by type for a cleaner UI
    const articles = matches.filter((m) => m.type === 'article');
    const highlights = matches.filter((m) => m.type === 'highlight');
    const others = matches.filter((m) => m.type === 'other');

    const flat = [];
    if (articles.length) { flat.push({ isHeader: true, label: 'หมวดมาตรา' }); articles.forEach((i) => flat.push({ isItem: true, ...i })); }
    if (highlights.length) { flat.push({ isHeader: true, label: 'หมวดคำอธิบาย' }); highlights.forEach((i) => flat.push({ isItem: true, ...i })); }
    if (others.length) { flat.push({ isHeader: true, label: 'หมวดอื่นๆ' }); others.forEach((i) => flat.push({ isItem: true, ...i })); }

    setResults(flat);
    setSelectedIndex(flat.findIndex((r) => r.isItem));
  }, [query, indexData, testRegex]);

  // --- Keyboard navigation inside the results panel ---
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          let next = prev + 1;
          while (next < results.length && !results[next].isItem) next++;
          return next < results.length ? next : prev;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && !results[next].isItem) next--;
          return next >= 0 ? next : prev;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected?.isItem) {
          setIsOpen(false);
          setInputValue('');
          setQuery('');
          inputRef.current?.blur();
          navigateToStackedPage(selected.slug);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, results, selectedIndex, navigateToStackedPage]);

  // --- Scroll active result into view ---
  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.querySelector('.selected')?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (slug) => {
      setIsOpen(false);
      setInputValue('');
      setQuery('');
      inputRef.current?.blur();
      navigateToStackedPage(slug);
    },
    [navigateToStackedPage]
  );

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Search input */}
      <Flex sx={{ alignItems: 'center', bg: 'rgba(255,255,255,0.12)', border: '1px solid rgba(246,244,247,0.35)', borderRadius: '8px', px: 2, py: '4px', gap: 1, ':focus-within': { borderColor: '#28c6b5' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'rgba(246,244,247,0.7)', flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </Box>
        <Input
          ref={inputRef}
          placeholder="ค้นหามาตรา..."
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const v = e.target.value;
            setInputValue(v);
            setIsOpen(true);
            clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => setQuery(v), 200);
          }}
          sx={{
            border: 'none', outline: 'none', fontSize: 1, p: 0,
            width: ['100px', '140px'], backgroundColor: 'transparent',
            color: '#f6f4f7',
            '::placeholder': { color: 'rgba(246,244,247,0.6)' },
            '&:focus': { outline: 'none' },
          }}
        />
      </Flex>

      {isOpen && (
        <>
          {/* Invisible overlay to close dropdown on outside click */}
          <Box
            onClick={() => setIsOpen(false)}
            sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
          />

          {query.trim().length > 0 && (
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                position: 'absolute', top: '100%', right: 0, mt: 1,
                width: ['calc(100vw - 32px)', '400px', '450px'],
                backgroundColor: 'background',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: '1px solid', borderColor: 'gray',
                display: 'flex', flexDirection: 'column',
                maxHeight: '70vh', zIndex: 1000,
              }}
            >
              {/* Loading spinner */}
              {loading && (
                <Flex sx={{ p: 3, justifyContent: 'center' }}>
                  <Spinner size={24} />
                </Flex>
              )}

              {/* Fetch error */}
              {fetchError && (
                <Text sx={{ p: 3, color: 'red', textAlign: 'center', fontSize: 1 }}>
                  {fetchError}
                </Text>
              )}

              <Box ref={resultsRef} sx={{ overflowY: 'auto', p: 2 }}>
                {/* No results */}
                {query && results.length === 0 && !loading && !fetchError && (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Text sx={{ color: 'text-light', display: 'block', mb: 1 }}>ไม่พบผลลัพธ์สำหรับ "{query}"</Text>
                    <Text sx={{ fontSize: 0, color: 'text-light', opacity: 0.7 }}>ลองพิมพ์ชื่อมาตรา เช่น ม1, ม19, หรือคำในเนื้อหา</Text>
                  </Box>
                )}

                {results.map((item, i) => {
                  if (item.isHeader) {
                    return (
                      <Text
                        key={`header-${i}`}
                        sx={{
                          px: 3, pt: 3, pb: 1, fontSize: 1,
                          fontWeight: 'bold', color: 'text-light',
                          textTransform: 'uppercase', letterSpacing: 0.5,
                        }}
                      >
                        {item.label}
                      </Text>
                    );
                  }

                  const isSelected = i === selectedIndex;
                  return (
                    <Box
                      key={`item-${item.slug}-${i}`}
                      className={isSelected ? 'selected' : ''}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => handleSelect(item.slug)}
                      sx={{
                        px: 3, py: 2, mx: 2, my: 1,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'accent' : 'transparent',
                        borderLeft: isSelected ? '3px solid' : '3px solid transparent',
                        borderLeftColor: isSelected ? 'primary' : 'transparent',
                        '&:hover': { backgroundColor: 'accent' },
                      }}
                    >
                      {/* Title with highlighted matches — rendered as safe JSX, not HTML */}
                      <HighlightedText
                        text={item.title}
                        regex={testRegex}
                        sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: isSelected ? 'primary' : 'text' }}
                      />
                      {item.snippet && (
                        <HighlightedText
                          text={item.snippet}
                          regex={testRegex}
                          sx={{
                            fontSize: 1, color: 'text', opacity: 0.8,
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
