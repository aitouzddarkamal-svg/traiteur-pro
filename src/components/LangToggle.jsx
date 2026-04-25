import { useLang } from '../context/LangContext';

export default function LangToggle() {
  const { lang, toggleLang } = useLang();

  return (
    <button
      onClick={toggleLang}
      title={lang === 'fr' ? 'Passer en arabe' : 'التبديل إلى الفرنسية'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 20,
        padding: '4px 10px',
        cursor: 'pointer',
        fontSize: 13,
        color: '#e8e8e0',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 16 }}>{lang === 'fr' ? '🇲🇦' : '🇫🇷'}</span>
      <span style={{ fontWeight: 500 }}>{lang === 'fr' ? 'عربي' : 'FR'}</span>
    </button>
  );
}
