import { useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { api } from "../api/http";
import Sidebar from "../components/Sidebar";
import { Search, BookOpen, File, FileSpreadsheet, FileText, Pin, MapPin, AlertTriangle } from "lucide-react";
 

/* ======= STYLES ======= */
const Layout = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
`;

const DashboardOverrides = createGlobalStyle`
  html.app-full-bleed,
  html.app-full-bleed body {
    background: ${({ theme }) => theme.colors.bg} !important;
    min-height: 100vh;
  }
  html.app-full-bleed #root {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 40px 40px 60px 260px;
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const ModalBox = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  max-width: 520px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModalTitle = styled.h3`
  background: ${({ theme }) => theme.colors.accent}; /* system yellow */
  color: ${({ theme }) => theme.colors.primary};
  margin: -20px -20px 12px -20px; /* extend title background to modal edges */
  padding: 12px 16px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  text-align: center;
`;

/* Clear pinned floating modal/button */
const ClearModal = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  z-index: 11000;
  transition: opacity 0.28s ease, transform 0.28s ease;
  opacity: ${(p) => (p.visible ? 1 : 0)};
  /* center horizontally using translateX(-50%) and animate vertically for show/hide */
  transform: ${(p) => (p.visible ? 'translate(-50%, 0)' : 'translate(-50%, 8px)')};
  pointer-events: ${(p) => (p.visible ? 'auto' : 'none')};
`;

const ClearModalInner = styled.div`
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ClearButton = styled.button`
  background: #ff4d4f; /* red */
  color: #000; /* black text */
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0,0,0,0.15);
  transition: transform 0.12s ease, background 0.12s ease, opacity 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    background: #e04345;
  }
`;

/* 🔹 NOVOS ESTILOS DO TOPO 🔹 */
const SearchWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch; /* allow left-aligning the message + search bar */
  margin-bottom: 40px;
`;

const QuotaBox = styled.div`
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(168,137,42,0.14);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 140px;
  margin-left: -64px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    margin-left: 0;
    width: auto;
  }
`;

const QuotaTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: rgba(168,137,42,0.95);
  margin-bottom: 6px;
`;

const QuotaNumber = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  transition: transform 220ms ease, opacity 180ms ease;
  transform: scale(${(p) => (p.pulse ? 1.08 : 1)});
`;

const InfoMessage = styled.p`
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.85;
  font-size: 0.95rem;
  margin-bottom: 12px;
  text-align: center; /* center above the search bar */
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
`;

const SearchContainer = styled.div`
  position: relative; /* needed so ReportButtons can be absolute-cornered */
  display: flex;
  align-items: center;
  justify-content: center; /* center the search bar */
  gap: 24px;
  flex-wrap: wrap;
  width: 100%;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
`;

const SearchBar = styled.div`
  flex: 0 1 auto;
  width: 100%;
  max-width: 700px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto; /* keep the search bar exactly centered */
  transform: translateX(-64px); /* bring the search bar closer to the QuotaBox */
  transition: transform 180ms ease;

  input {
    flex: 1;
    padding: 14px 18px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    font-size: 1rem;
    transition: all 0.2s ease;

    &:focus {
      border-color: ${({ theme }) => theme.colors.accent};
      outline: none;
      box-shadow: 0 0 6px rgba(168, 137, 42, 0.12);
    }
  }

    button {
    background: ${({ theme }) => theme.colors.accent};
    border: none;
    border-radius: 10px;
    color: ${({ theme }) => theme.colors.primary};
    padding: 12px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: 0.3s;

    &:hover {
      background: rgba(182,151,51,0.9);
    }

    svg {
      height: 20px;
      width: 20px;
      margin-right: 4px;
    }
  }

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 0 12px;
    transform: none;
  }
`;

const ReportButtons = styled.div`
  position: absolute; /* pin to the right corner of SearchContainer */
  right: 0;
  top: 50%;
  transform: translateY(-50%) translateX(80px); /* nudge buttons a bit left compared to before */
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 200px;

  button {
    background: #a8892a;
    color: #0b0b0b;
    border: none;
    border-radius: 10px;
    padding: 10px 16px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.3s;

    &:hover {
      background: #b69733;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  @media (max-width: 700px) {
    position: static; /* allow wrapping on small screens */
    transform: none;
    margin-left: 0;
    margin-top: 8px;
    justify-content: center;
  }

  @media (min-width: 1200px) {
    transform: translateY(-50%) translateX(160px); /* slightly less push on very wide screens */
  }
`;

const SuggestionBox = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 0 10px rgba(168, 137, 42, 0.06);
  max-width: 600px;
  margin: 0 auto;
`;

const SuggestionItem = styled.div`
  padding: 10px 15px;
  cursor: pointer;
  transition: 0.2s;
  color: ${({ theme }) => theme.colors.text};

  &:hover {
    background: ${({ theme }) => theme.colors.hover};
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const NcmGroup = styled.div`
  margin-bottom: 30px;
  border: 1px solid #222;
  border-radius: 12px;
  overflow: hidden;
`;

const NcmHeader = styled.div`
  background: ${({ pinned, theme }) => (pinned ? theme.colors.accent : theme.colors.hover)};
  color: ${({ pinned, theme }) => (pinned ? theme.colors.primary : theme.colors.text)};
  font-weight: 600;
  padding: 14px 18px;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  position: relative; /* allow absolutely-positioning the centered block */
  justify-content: space-between;
  align-items: flex-start; /* align left block to the top so code sits top-left */
  gap: 6px;

  &:hover {
    background: ${({ pinned, theme }) => (pinned ? 'rgba(182,151,51,0.95)' : theme.colors.hover)};
  }

  /* left-side and center blocks - scoped classes to avoid globally styling all divs */
    .header-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;

    span {
      text-align: left;
      font-size: 0.95rem;
      /* Use theme text color when not pinned, primary when pinned so dark theme remains readable */
      color: ${({ pinned, theme }) => (pinned ? theme.colors.primary : theme.colors.text)};
      opacity: 1;
    }

    .meta-group {
      display: flex;
      flex-direction: column; /* capítulo above posição */
      gap: 6px;
      margin-top: 20px; /* moved down ~1 line to better align with center block */
      align-items: flex-start;
    }

    .meta-group span {
      /* Allow wrapping but only after a larger width to avoid early/ugly breaks.
         Use inline-block so max-width applies; allow long words to break when needed. */
      display: inline-block;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      text-overflow: clip;
      max-width: 1200px; /* increased threshold before the text wraps */
      /* ensure meta values inherit readable color based on pinned state */
      color: ${({ pinned, theme }) => (pinned ? theme.colors.primary : theme.colors.text)};
    }

    /* On smaller viewports let the meta spans use full width and wrap naturally */
    @media (max-width: 1200px) {
      .meta-group span {
        max-width: 100%;
        display: block;
        white-space: normal;
      }
    }
  }

  .header-center {
    display: flex;
    flex-direction: column;
    align-items: center; /* center horizontally */
    justify-content: flex-start; /* keep content at top */
    gap: 0;
  position: absolute; /* visually center across the header */
  left: 50%;
  transform: translateX(-50%);
  top: 6px; /* move up one line compared to previous value */
    z-index: 1;
    max-width: 60%; /* avoid overlapping left/right blocks */

    strong {
      color: ${({ pinned, theme }) => (pinned ? theme.colors.primary : theme.colors.accent)};
      font-size: 1rem;
      line-height: 1;
      flex: 0 0 auto;
      margin-right: 0;
    }

    .desc {
      /* match the code font size/weight so description appears equal to code */
      font-weight: 600;
      color: ${({ pinned, theme }) => (pinned ? theme.colors.primary : theme.colors.text)};
      font-size: 1rem;
      line-height: 1;
      opacity: 0.95;
      text-align: center;
      /* don't grow — keep adjacent to the code */
      flex: 0 1 auto;
      min-width: 0; /* allow proper truncation */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
      /* nudge description slightly relative to the code for visual alignment */
      transform: translateY(1px);
      transition: transform 0.12s ease;
    }

    .code-group {
      /* keep code and description contiguous and underline them as one unit */
      display: inline-flex;
      flex-direction: row;
      gap: 0; /* no gap so code and desc are contiguous */
      align-items: center; /* vertically center code + description together */
      justify-content: center;
      width: auto; /* size to content so underline matches text width */
      overflow: hidden;
      justify-self: center;
      border-bottom: 1px solid ${({ pinned, theme }) => (pinned ? theme.colors.primary : theme.colors.border)};
      padding-bottom: 0px; /* brought underline even closer to the text */
    }
  }

  span:last-child {
    font-size: 0.85rem;
    opacity: 0.9;
    align-self: flex-start;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.surface};
  /* center the grid when there are fewer columns and make items stretch to fill their cells
     so sibling cards match heights and avoid gaps between cards */
  justify-content: center;
  justify-items: stretch;
  align-items: stretch;
  grid-auto-rows: 1fr;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 16px 16px 60px;
  box-shadow: 0 0 10px rgba(168, 137, 42, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;
  min-height: 360px;
  /* fill the grid row height so sibling cards match */
  height: 100%;
  width: 100%;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 16px rgba(168, 137, 42, 0.08);
  }
`;

const Section = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};

  strong {
    color: ${({ theme }) => theme.colors.accent};
  }

  p {
    margin: 4px 0;
  }
`;

const AliquotaBox = styled.div`
  background: rgba(168, 137, 42, 0.06);
  border: 1px solid rgba(168,137,42,0.18);
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 10px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IsentoBadge = styled.div`
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(168,137,42,0.15);
  border: 1px solid rgba(168,137,42,0.33);
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LawButtonContainer = styled.div`
  position: absolute;
  bottom: 16px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 12px;
  /* remove gradient so no background appears behind the button in any theme */
  background: transparent;
`;

const LawButton = styled.a`
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  text-decoration: none;
  transition: 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;

  &:hover {
    background: rgba(182,151,51,0.9);
  }
`;

/* ======= COMPONENT ======= */
export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [quota, setQuota] = useState(null);
  const [pulse, setPulse] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [items, setItems] = useState([]);
  const [quotaMessage, setQuotaMessage] = useState('');
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [pinnedCodes, setPinnedCodes] = useState([]);
  const [headerPinnedCodes, setHeaderPinnedCodes] = useState([]); // codes pinned via header click
  const [selectedCards, setSelectedCards] = useState([]); // array of `${codigo}-${cClas}`
  const [selectedAllCodes, setSelectedAllCodes] = useState([]); // array of codigo strings where all cards selected

  // derived state: whether there is any pinned header/card
  const hasPinned = (pinnedCodes && pinnedCodes.length > 0) || (headerPinnedCodes && headerPinnedCodes.length > 0) || (selectedCards && selectedCards.length > 0) || (selectedAllCodes && selectedAllCodes.length > 0);

  function clearAllPinned() {
    setPinnedCodes([]);
    setHeaderPinnedCodes([]);
    setSelectedCards([]);
    setSelectedAllCodes([]);
  }

  useEffect(() => {
    document.documentElement.classList.add("app-full-bleed");
    return () => document.documentElement.classList.remove("app-full-bleed");
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/util/quota');
        if (!mounted) return;
        setQuota(data);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function fetchSuggestions(value) {
    if (!value.trim()) return setSuggestions([]);
    try {
      const { data } = await api.get("/ncm/sugestoes", { params: { q: value } });
      setSuggestions(data);
      setNoResults(data.length === 0);
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
    }
  }

  async function searchNcm(code) {
    setQuery(code);
    setSuggestions([]);
    setNoResults(false);
    try {
      const { data } = await api.get("/ncm", { params: { q: code } });
  setQuotaMessage('');
  setQuotaModalOpen(false);
      // decrement remaining locally (increment used) with animation
      setQuota((prev) => {
        if (!prev) return prev;
        const used = Math.min(prev.limit || 0, (prev.used || 0) + 1);
        return { ...prev, used };
      });
      setPulse(true);
      setTimeout(() => setPulse(false), 300);
      const pinnedItems = items.filter((i) => pinnedCodes.includes(i.codigo));
      // Show newly searched items first, then keep pinned items afterwards
      const combined = [...data, ...pinnedItems];
      const unique = Array.from(
        new Map(combined.map((i) => [`${i.codigo}-${i.cClasstrib}`, i])).values()
      );
      setItems(unique);
    } catch (err) {
      // Handle quota exceeded
      if (err?.response?.status === 429) {
        const { used, limit, error } = err.response.data || {};
        const msg = error || `Limite diário de buscas atingido (${used || 0}/${limit || '—'})`;
        setQuotaMessage(msg);
        setQuotaModalOpen(true);
        return;
      }
      console.error("Erro ao buscar NCM:", err);
    }
  }

  function togglePin(codigo) {
    setHeaderPinnedCodes((prev) => {
      if (prev.includes(codigo)) {
        // unpin header
        const next = prev.filter((c) => c !== codigo);
        // recompute pinnedCodes: remove codigo unless it's selected by cards or selectedAll
        setPinnedCodes((pc) => {
          const stillHas = (selectedAllCodes || []).includes(codigo) || (selectedCards || []).some(k => k.startsWith(`${codigo}-`));
          if (stillHas) return pc.includes(codigo) ? pc : [...pc, codigo];
          return pc.filter((c) => c !== codigo);
        });
        return next;
      }
      // pin header
      setPinnedCodes((pc) => (pc.includes(codigo) ? pc : [...pc, codigo]));
      return [...prev, codigo];
    });
  }

  function toggleSelectCard(codigo, classCodigo) {
    const key = `${codigo}-${classCodigo}`;
    setSelectedCards((prev) => {
      if (prev.includes(key)) {
        // unselect -> also unpin this card's code if it was pinned only because of selection
        const next = prev.filter((p) => p !== key);
        // remove pin for this codigo if no other selected card remains for it and it wasn't pinned manually
        const stillSelectedForCode = next.some((k) => k.startsWith(`${codigo}-`));
        if (!stillSelectedForCode) {
          setPinnedCodes((pc) => pc.filter((c) => c !== codigo));
        }
        return next;
      }
      // select -> add and also pin the codigo
      setPinnedCodes((pc) => (pc.includes(codigo) ? pc : [...pc, codigo]));
      return [...prev, key];
    });
  }

  function toggleSelectAll(codigo) {
    setSelectedAllCodes((prev) => {
      if (prev.includes(codigo)) {
        // unselect all: remove any individual selections for this codigo and unpin
        setSelectedCards((cards) => cards.filter((k) => !k.startsWith(`${codigo}-`)));
        setPinnedCodes((pc) => pc.filter((c) => c !== codigo));
        return prev.filter((c) => c !== codigo);
      }
      // select all: add code to selectedAll and pin it
      setPinnedCodes((pc) => (pc.includes(codigo) ? pc : [...pc, codigo]));
      return [...prev, codigo];
    });
  }

  async function gerarRelatorio(formato) {
    // build the set of NCM codes to request: union of pinned codes + selectedAllCodes + codes from selectedCards
    const codesSet = new Set([...(pinnedCodes || []), ...(selectedAllCodes || [])]);
    (selectedCards || []).forEach((k) => {
      const code = k.split("-")[0];
      if (code) codesSet.add(code);
    });

    if (codesSet.size === 0) {
      alert("Nenhum NCM selecionado para gerar relatório.");
      return;
    }

    const codigosArr = Array.from(codesSet);

    // build selected parameter: include codes marked as ALL as `${code}-ALL`, and individual selected cards
    const selectedParams = [];
    (selectedAllCodes || []).forEach((c) => selectedParams.push(`${c}-ALL`));
    (selectedCards || []).forEach((k) => {
      const code = k.split("-")[0];
      if (!selectedAllCodes.includes(code)) selectedParams.push(k);
    });

    // IMPORTANT: if user pinned a NCM header (in pinnedCodes) but didn't explicitly
    // select any card for it (and didn't mark it as selectedAll), we still want to
    // include all cards for that pinned NCM in the report. To achieve that, add
    // `${code}-ALL` for pinned codes that don't have individual selections nor are
    // already in selectedAllCodes.
    (pinnedCodes || []).forEach((code) => {
      const hasIndividual = (selectedCards || []).some((k) => k.startsWith(`${code}-`));
      const alreadyAll = (selectedAllCodes || []).includes(code);
      const alreadyInParams = selectedParams.some((p) => p.startsWith(`${code}-`));
      if (!hasIndividual && !alreadyAll && !alreadyInParams) {
        selectedParams.push(`${code}-ALL`);
      }
    });

    const params = new URLSearchParams({ codigos: codigosArr.join(","), formato });
    if (selectedParams.length) params.set("selected", selectedParams.join(","));

    const url = `${api.defaults.baseURL}/relatorio?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao gerar relatório");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `relatorio_ncm.${formato}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar relatório");
    }
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.codigo]) acc[item.codigo] = [];
    acc[item.codigo].push(item);
    return acc;
  }, {});

  // cache of chapter descriptions by two-digit chapter code (e.g. '01', '02')
  const [chaptersMap, setChaptersMap] = useState({});
  // cache of position descriptions by four-digit position code (e.g. '0101')
  const [positionsMap, setPositionsMap] = useState({});
  // cache of subposition descriptions by five-digit subposition code (e.g. '01010')
  const [subpositionsMap, setSubpositionsMap] = useState({});

  // helper to remove internal newlines and collapse whitespace for inline labels
  function cleanText(v) {
    return String(v || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // fetch chapter (2-digit) and position (4-digit) descriptions for header codes not yet cached
  useEffect(() => {
    const codes = Object.keys(groupedItems || {});
    // two-digit prefixes for chapters
    const chapterPrefixes = Array.from(new Set(codes.map(c => String(c || '').slice(0,2))));
    const chaptersToFetch = chapterPrefixes.filter(p => p && !chaptersMap[p]);

    // four-digit prefixes for positions
    // normalize by removing non-digits, taking first 4 digits and padding to 4 so keys match backend
    const positionPrefixes = Array.from(new Set(codes.map((c) => {
      const digits = String(c || '').replace(/\D/g, '');
      return String((digits || '').slice(0,4)).padStart(4, '0');
    })));
    const positionsToFetch = positionPrefixes.filter(p => p && p !== '0000' && !positionsMap[p]);

    // five-digit prefixes for subpositions
    // normalize by removing non-digits, taking first 5 digits and padding to 5 so keys match backend
    const subpositionPrefixes = Array.from(new Set(codes.map((c) => {
      const digits = String(c || '').replace(/\D/g, '');
      return String((digits || '').slice(0,5)).padStart(5, '0');
    })));
    const subpositionsToFetch = subpositionPrefixes.filter(p => p && p !== '00000' && !subpositionsMap[p]);

    if (!chaptersToFetch.length && !positionsToFetch.length) return;

    (async () => {
      try {
        // fetch chapters
        for (const p of chaptersToFetch) {
          try {
            const { data } = await api.get(`/util/chapter/${encodeURIComponent(p)}`);
            setChaptersMap(prev => ({ ...prev, [p]: data }));
          } catch (err) {
            // mark not found as null to avoid retrying repeatedly
            setChaptersMap(prev => ({ ...prev, [p]: null }));
          }
        }

        // fetch positions
        for (const p of positionsToFetch) {
          try {
            const { data } = await api.get(`/util/position/${encodeURIComponent(p)}`);
            setPositionsMap(prev => ({ ...prev, [p]: data }));
          } catch (err) {
            // mark not found as null to avoid retrying repeatedly
            setPositionsMap(prev => ({ ...prev, [p]: null }));
          }
        }

        // fetch subpositions
        for (const p of subpositionsToFetch) {
          try {
            const { data } = await api.get(`/util/subposition/${encodeURIComponent(p)}`);
            setSubpositionsMap(prev => ({ ...prev, [p]: data }));
          } catch (err) {
            // mark not found as null to avoid retrying repeatedly
            setSubpositionsMap(prev => ({ ...prev, [p]: null }));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar capítulos/posições:', err);
      }
    })();
  }, [items]);

  return (
    <>
      <DashboardOverrides />
      <Layout>
        <Sidebar />
        <Content>
          {/* 🔹 Campo de busca e botões */}
          <SearchWrapper>
            <InfoMessage>
              Digite um código ou descrição de NCM e clique na lupa para buscar.
            </InfoMessage>

            <SearchContainer>
              {/* Quota box placed to the left of the search bar */}
              <QuotaBox>
                {quota ? (
                  (() => {
                    const used = quota.used || 0;
                    const limit = quota.limit || 0;
                    const remaining = Math.max(0, limit - used);
                    return (
                      <>
                        <QuotaTitle>consultas restantes:</QuotaTitle>
                        <QuotaNumber pulse={pulse}>{remaining}</QuotaNumber>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <QuotaTitle>consultas restantes:</QuotaTitle>
                    <QuotaNumber pulse={false}>-</QuotaNumber>
                  </>
                )}
              </QuotaBox>
                {/* quotaMessage is now shown in a modal when needed */}
              <SearchBar>
                <input
                  placeholder="Buscar por código ou descrição..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    fetchSuggestions(e.target.value);
                  }}
                />
                <button onClick={() => searchNcm(query)}>
                  <Search /> <strong>Buscar</strong>
                </button>
              </SearchBar>

              {pinnedCodes.length > 0 && (
                <ReportButtons>
                    <button onClick={() => gerarRelatorio("pdf")} aria-label="Gerar PDF">
                      <File size={16} style={{ marginRight: 8 }} /> PDF
                    </button>
                    <button onClick={() => gerarRelatorio("xlsx")} aria-label="Gerar Excel">
                      <FileSpreadsheet size={16} style={{ marginRight: 8 }} /> Excel
                    </button>
                    <button onClick={() => gerarRelatorio("txt")} aria-label="Gerar TXT">
                      <FileText size={16} style={{ marginRight: 8 }} /> TXT
                    </button>
                </ReportButtons>
              )}
            </SearchContainer>
          </SearchWrapper>

          {/* Sugestões */}
          {query.trim() && (
            <SuggestionBox>
              {noResults ? (
                <SuggestionItem
                  style={{
                    color: "#777",
                    textAlign: "center",
                    cursor: "default",
                    padding: "12px",
                    fontStyle: "italic",
                  }}
                >
                  Nenhum NCM encontrado
                </SuggestionItem>
              ) : (
                suggestions.map((s) => (
                  <SuggestionItem
                    key={`${s.codigo}-${s.cClasstrib}`}
                    onClick={() => searchNcm(s.codigo)}
                  >
                    {s.codigo} — {s.descricao}
                  </SuggestionItem>
                ))
              )}
            </SuggestionBox>
          )}

          {/* Resultados */}
          {Object.entries(groupedItems).map(([codigo, group]) => {
            const headerSelectedCount = (selectedCards || []).filter((k) => k.startsWith(`${codigo}-`)).length;
            return (
            <NcmGroup key={codigo}>
              <NcmHeader
                pinned={pinnedCodes.includes(codigo)}
                onClick={() => togglePin(codigo)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', justifyContent: 'space-between' }}>
                  {/* left: capítulo/posição aligned to the left corner */}
                  <div className="header-left" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, flex: '0 1 auto' }}>
                    <div className="meta-group">
                      <span style={{ fontSize: '0.95rem', opacity: 0.9, textAlign: 'left' }}>
                        <strong>CAPÍTULO:</strong> {(() => {
                          const digits = String(codigo || '').replace(/\D/g, '');
                          const pref2 = String((digits || '').slice(0,2)).padStart(2, '0');
                          const ch = chaptersMap[pref2];
                          return ch && ch.description ? cleanText(ch.description) : '—';
                        })()}
                      </span>

                      {(() => {
                        // compute normalized prefixes
                        const digits = String(codigo || '').replace(/\D/g, '');
                        const pref4 = String((digits || '').slice(0,4)).padStart(4, '0');
                        const pref5 = String((digits || '').slice(0,5)).padStart(5, '0');

                        const pos = positionsMap[pref4];
                        const sub = subpositionsMap[pref5];
                        const ncmDesc = group[0]?.descricao || group[0]?.ncmDescricao || '';

                        // Logic requested by user:
                        // - if no position and no subposition -> position shows NCM description, subposition shows 'Nao se aplica'
                        // - if chapter and position exist but no subposition -> subposition shows NCM description
                        // - otherwise show available descriptions (or '—')

                        let positionDisplay = '—';
                        let subpositionDisplay = '—';

                        const hasPosition = pos && pos.description;
                        const hasSubposition = sub && sub.description;

                        if (!hasPosition && !hasSubposition) {
                          positionDisplay = ncmDesc ? cleanText(ncmDesc) : '—';
                          subpositionDisplay = 'Nao se aplica';
                        } else if (hasPosition && !hasSubposition) {
                          positionDisplay = cleanText(pos.description);
                          subpositionDisplay = ncmDesc ? cleanText(ncmDesc) : '—';
                        } else {
                          positionDisplay = hasPosition ? cleanText(pos.description) : (ncmDesc ? cleanText(ncmDesc) : '—');
                          subpositionDisplay = hasSubposition ? cleanText(sub.description) : '—';
                        }

                        // sanitize subposition display: remove '-' and ':' characters and collapse spaces
                        if (typeof subpositionDisplay === 'string' && subpositionDisplay !== '—' && subpositionDisplay !== 'Nao se aplica') {
                          subpositionDisplay = subpositionDisplay.replace(/[-:]/g, '').replace(/\s+/g, ' ').trim();
                        }

                        return (
                          <>
                            <span style={{ fontSize: '0.95rem', opacity: 0.95, textAlign: 'left' }}>
                              <strong>POSIÇÃO:</strong> {positionDisplay}
                            </span>
                            <span style={{ fontSize: '0.95rem', opacity: 0.95, textAlign: 'left' }}>
                              <strong>SUBPOSIÇÃO:</strong> {subpositionDisplay}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* center: código e descrição centralizados (aligned with capítulo vertically, centered horizontally) */}
                  <div className="header-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 6, flex: '1 1 auto', minWidth: 0 }}>
                    {/* inner grouped block so code+desc are a single unit */}
                   <u> <div className="code-group">
                      <strong>{codigo}</strong>{'\u00A0'}
                      <span className="desc">{group[0].descricao || ''}<strong></strong></span>
                    </div></u>
                  </div>
                </div>
                <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {/* Show "Fixado: todos" only when header was pinned and there are no individual selections for it */}
                  {((headerPinnedCodes.includes(codigo) && headerSelectedCount === 0 && !selectedAllCodes.includes(codigo)) || selectedAllCodes.includes(codigo)) ? (
                    <>
                      <Pin size={16} style={{ marginRight: 8 }} /> Fixado: todos
                    </>
                  ) : headerSelectedCount > 0 ? (
                    <>
                      <Pin size={16} style={{ marginRight: 8 }} /> Fixado: {headerSelectedCount}
                    </>
                  ) : (
                    <>
                      <MapPin size={16} style={{ marginRight: 8 }} /> Clique para fixar
                    </>
                  )}
                </span>
              </NcmHeader>

              <Grid>
                {group.map((item) => {
                  const { classTrib } = item;
                  if (!classTrib) return null;

                  const classKey = classTrib.codigoClassTrib || item.cClasstrib || classTrib.id || '';
                  const compositeKey = `${item.codigo}-${classKey}`;

                  const pRedIBS = parseFloat(classTrib.pRedIBS) || 0;
                  const pRedCBS = parseFloat(classTrib.pRedCBS) || 0;
                  const cst = classTrib.cstIbsCbs?.toString();
                  const cstZerados = ["400", "410", "510", "515","550", "620"];
                  const isIsento = cstZerados.includes(cst);

                  const aliquotaIBS = isIsento ? 0 : 0.1 * (1 - pRedIBS / 100);
                  const aliquotaCBS = isIsento ? 0 : 0.9 * (1 - pRedCBS / 100);

                  // visual pinned logic for cards:
                  const isIndividuallySelected = (selectedCards || []).includes(compositeKey);
                  const isAllSelectedForCode = (selectedAllCodes || []).includes(item.codigo);
                  const headerPinnedWithoutIndividual = pinnedCodes.includes(item.codigo) && headerSelectedCount === 0 && !isAllSelectedForCode;
                  const isCardPinned = isIndividuallySelected || isAllSelectedForCode || headerPinnedWithoutIndividual;

                  return (
                    <Card key={compositeKey}>
                      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* Pin marker moved to the right side next to the checkbox */}
                        {isCardPinned && <Pin size={14} color="#a8892a" />}
                        <input
                          type="checkbox"
                          checked={isAllSelectedForCode || isIndividuallySelected}
                          onChange={(e) => { e.stopPropagation(); toggleSelectCard(item.codigo, classKey); }}
                          title={isAllSelectedForCode ? 'Todos selecionados' : (isIndividuallySelected ? 'Desmarcar' : 'Selecionar')}
                        />
                      </div>
                      <Section>
                        <p>
                          <strong>CST:</strong> {cst || "—"}
                        </p>
                        <p>
                          <strong>cClasTrib:</strong>{" "}
                          {classTrib.codigoClassTrib
                            ?.toString()
                            .padStart(6, "0")}
                        </p>
                        <p>
                          <strong>Descrição:</strong>{" "}
                          {classTrib.descricaoClassTrib || "—"}
                        </p>
                        <p>
                          <strong>Redução IBS/CBS:</strong>{" "}
                          {classTrib.pRedIBS}% / {classTrib.pRedCBS}%
                        </p>

                        <AliquotaBox>
                          <p>
                            <strong>Alíquota IBS:</strong>{" "}
                            {aliquotaIBS.toFixed(2)}%
                          </p>
                          <p>
                            <strong>Alíquota CBS:</strong>{" "}
                            {aliquotaCBS.toFixed(2)}%
                          </p>

                          {isIsento && (
                            <IsentoBadge>
                              {(() => {
                                const cstText = {
                                  "400": "ISENÇÃO",
                                  "410": "IMUNIDADE / NÃO INCIDÊNCIA",
                                  "510": "DIFERIMENTO",
                                  "515": "DIFERIMENTO",
                                  "550": "SUSPENSÃO",
                                  "620": "TRIBUTAÇÃO MONOFÁSICA",
                                }[cst];
                                const text = cstText || "Tratamento Tributário Específico";
                                return (
                                  <>
                                    <AlertTriangle size={14} color="#a8892a" style={{ marginRight: 8 }} />
                                    {text}
                                  </>
                                );
                              })()}
                            </IsentoBadge>
                          )}
                        </AliquotaBox>

                        <LawButtonContainer>
                          <LawButton
                            href={classTrib.link || "#"}
                            target={classTrib.link ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            style={{
                              opacity: classTrib.link ? 1 : 0.5,
                              cursor: classTrib.link
                                ? "pointer"
                                : "not-allowed",
                            }}
                          >
                            <BookOpen
                              size={18}
                              color="#0b0b0b"
                              strokeWidth={2}
                            />
                            Base Legal - LC 214/25
                          </LawButton>
                        </LawButtonContainer>
                      </Section>
                    </Card>
                  );
                })}
              </Grid>
            </NcmGroup>
          )})}
        </Content>

        {/* Floating clear pinned modal/button (appears only when any item is pinned) */}
        <ClearModal visible={hasPinned} aria-hidden={!hasPinned}>
          <ClearModalInner>
            <ClearButton onClick={clearAllPinned}>Limpar fixados</ClearButton>
          </ClearModalInner>
        </ClearModal>
        {quotaModalOpen && (
          <ModalOverlay>
            <ModalBox>
              <ModalTitle>Limite de buscas atingido</ModalTitle>
              <p>{quotaMessage}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button onClick={() => setQuotaModalOpen(false)} style={{ background: '#a8892a', color: '#0b0b0b', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Fechar</button>
              </div>
            </ModalBox>
          </ModalOverlay>
        )}
      </Layout>
    </>
  );
}
