import { useState, useEffect, useCallback } from 'react'
import './App.css'
import MapSection from './components/MapSection'
import ChartsSection from './components/ChartsSection'

const NAV_ITEMS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: '⬡' },
  { id: 'map',      label: 'Carte',            icon: '◎' },
  { id: 'listings', label: 'Annonces',          icon: '▤' },
  { id: 'guide',    label: 'Comment ça marche', icon: '▦' },
]

const fmt = (n, decimals = 0) =>
  n != null
    ? Number(n).toLocaleString('fr-FR', { maximumFractionDigits: decimals })
    : '—'

function App() {
  const [searchQuery,  setSearchQuery]  = useState('')
  const [searchType,   setSearchType]   = useState('city')
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen,  setSidebarOpen]  = useState(true)

  // API state
  const [globalStats,     setGlobalStats]     = useState(null)
  const [kpiStats,        setKpiStats]        = useState(null)
  const [chartStats,      setChartStats]      = useState(null)
  const [listings,        setListings]        = useState([])
  const [totalListings,   setTotalListings]   = useState(0)
  const [nextPage,        setNextPage]        = useState(null)
  const [prevPage,        setPrevPage]        = useState(null)
  const [currentPage,     setCurrentPage]     = useState(1)
  const [apiLoading,      setApiLoading]      = useState(true)
  const [apiError,        setApiError]        = useState('')
  const [activeFilter,    setActiveFilter]    = useState('')

  // ── Fetch stats on mount ───────────────────────────────────────────────
  useEffect(() => {
    // all_zones=1 returns every postal code, not just top-N (used by sidebar + map)
    fetch('/api/listings/stats/?all_zones=1')
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(data => {
        setGlobalStats(data)
        setChartStats(data)
      })
      .catch(err => setApiError('Impossible de charger les statistiques: ' + err.message))

    // KPI stats: light payload (no full by_postal list)
    fetch('/api/listings/stats/?all_zones=0')
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(data => setKpiStats(data))
      .catch(err => setApiError('Impossible de charger les KPI: ' + err.message))
  }, [])

  const fetchCharts = useCallback((params = {}) => {
    const qs = new URLSearchParams()
    qs.set('all_zones', '1')
    if (params.search)      qs.set('search', params.search)
    if (params.code_postal) qs.set('code_postal', params.code_postal)

    fetch(`/api/listings/stats/?${qs}`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(data => setChartStats(data))
      .catch(err => setApiError('Impossible de charger les graphes: ' + err.message))
  }, [])

  useEffect(() => {
    // When filter cleared, charts go back to the global dataset
    if (!activeFilter && globalStats) setChartStats(globalStats)
  }, [activeFilter, globalStats])

  const fetchKpis = useCallback((params = {}) => {
    const qs = new URLSearchParams()
    qs.set('all_zones', '0')
    if (params.search)      qs.set('search', params.search)
    if (params.code_postal) qs.set('code_postal', params.code_postal)

    fetch(`/api/listings/stats/?${qs}`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(data => setKpiStats(data))
      .catch(err => setApiError('Impossible de charger les KPI: ' + err.message))
  }, [])

  // ── Fetch listings ─────────────────────────────────────────────────────
  const fetchListings = useCallback((params = {}) => {
    setApiLoading(true)
    const qs = new URLSearchParams()
    if (params.search)      qs.set('search', params.search)
    if (params.code_postal) qs.set('code_postal', params.code_postal)
    if (params.page)        qs.set('page', params.page)

    fetch(`/api/listings/?${qs}`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(data => {
        setListings(data.results || [])
        setTotalListings(data.count || 0)
        setNextPage(data.next)
        setPrevPage(data.previous)
      })
      .catch(err => setApiError('Impossible de charger les annonces: ' + err.message))
      .finally(() => setApiLoading(false))
  }, [])

  useEffect(() => { fetchListings() }, [fetchListings])

  // ── Search ─────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault()
    const isPostal = /^\d{5}$/.test(searchQuery.trim())
    setCurrentPage(1)
    setActiveFilter(searchQuery.trim())
    if (isPostal || searchType === 'postal') {
      const code = searchQuery.trim()
      fetchListings({ code_postal: code })
      fetchKpis({ code_postal: code })
      fetchCharts({ code_postal: code })
    } else {
      const q = searchQuery.trim()
      fetchListings({ search: q })
      fetchKpis({ search: q })
      fetchCharts({ search: q })
    }
    scrollTo('listings')
  }

  const clearFilter = () => {
    setSearchQuery('')
    setActiveFilter('')
    setCurrentPage(1)
    fetchListings()
    fetchKpis()
    if (globalStats) setChartStats(globalStats)
  }

  const paginate = (direction) => {
    const newPage = currentPage + direction
    setCurrentPage(newPage)
    fetchListings({
      search:      activeFilter && !/^\d{5}$/.test(activeFilter) ? activeFilter : '',
      code_postal: activeFilter && /^\d{5}$/.test(activeFilter)  ? activeFilter : '',
      page:        newPage,
    })
    document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filterByPostal = (code) => {
    setSearchQuery(code)
    setActiveFilter(code)
    setCurrentPage(1)
    fetchListings({ code_postal: code })
    fetchKpis({ code_postal: code })
    fetchCharts({ code_postal: code })
    scrollTo('listings')
  }

  const scrollTo = (id) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const totalPages = Math.ceil(totalListings / 20)

  return (
    <div className={`dashboard${sidebarOpen ? '' : ' sidebar-collapsed'}`}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">IDF</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Logement</span>
            <span className="sidebar-brand-sub">Île-de-France</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item${activeSection === item.id ? ' nav-item--active' : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Top postal codes shortcut */}
        {globalStats?.by_postal?.length > 0 && (
          <div className="sidebar-section">
            <p className="sidebar-section-label">Zones actives</p>
            <div className="dept-list">
              {globalStats.by_postal.slice(0, 8).map(zone => (
                <button
                  key={zone.code_postal}
                  className={`dept-item${activeFilter === zone.code_postal ? ' dept-item--active' : ''}`}
                  onClick={() => filterByPostal(zone.code_postal)}
                >
                  <span className="dept-code">{zone.code_postal}</span>
                  <span className="dept-name">{fmt(zone.avg_price)} €/mois</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <span className="sidebar-dot" />
          <p>{globalStats ? `${fmt(globalStats.total)} annonces` : 'Chargement…'}</p>
        </div>
      </aside>

      {/* ── Dashboard Body ── */}
      <div className="dashboard-body">

        {/* Topbar */}
        <header className="topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
            ☰
          </button>

          <div className="topbar-title">
            <span className="topbar-eyebrow">Plateforme étudiante</span>
            <h1>Analyse locative</h1>
          </div>

          <div className="topbar-search-wrap">
            <form className="topbar-search" onSubmit={handleSearch}>
              <span className="search-type-toggle">
                <button type="button" className={`search-type-btn${searchType === 'city' ? ' active' : ''}`} onClick={() => setSearchType('city')}>Ville</button>
                <span className="search-type-divider">/</span>
                <button type="button" className={`search-type-btn${searchType === 'postal' ? ' active' : ''}`} onClick={() => setSearchType('postal')}>Code postal</button>
              </span>
              <input
                type="text"
                className="search-input"
                placeholder={searchType === 'city' ? 'Paris, Créteil, Vincennes…' : '75011, 94200…'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-submit" aria-label="Rechercher">→</button>
            </form>
          </div>

          <div className="topbar-meta">
            {activeFilter
              ? <button className="topbar-filter-badge" onClick={clearFilter}>{activeFilter} ✕</button>
              : <span className="topbar-badge">IDF</span>
            }
          </div>
        </header>

        {/* Main */}
        <main className="dashboard-main">

          {apiError && (
            <div className="api-error">
              ⚠ {apiError} — <a href="http://localhost:8000/api/" target="_blank" rel="noreferrer">vérifier le backend</a>
            </div>
          )}

          {/* ── Bandeau filtre actif (visible + compteur) ── */}
          {activeFilter && (
            <div className="filter-strip" role="status" aria-live="polite">
              <span className="filter-strip-icon" aria-hidden>◇</span>
              <span className="filter-strip-label">Filtre actif :</span>
              <strong className="filter-strip-value">{activeFilter}</strong>
              <span className="filter-strip-count">
                {apiLoading ? '…' : `${fmt(totalListings)} annonce${totalListings !== 1 ? 's' : ''}`}
              </span>
              <button type="button" className="filter-strip-clear" onClick={clearFilter}>
                Effacer le filtre
              </button>
            </div>
          )}

          {/* ── KPI Row ── */}
          <section id="overview" className="kpi-row">
            <div className="kpi-card">
              <span className="kpi-label">Annonces disponibles</span>
              <strong className="kpi-value">{fmt(kpiStats?.total)}</strong>
              <span className="kpi-sub">
                {activeFilter ? `pour « ${activeFilter} »` : 'logements en Île-de-France'}
              </span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Loyer moyen</span>
              <strong className="kpi-value">{fmt(kpiStats?.avg_price)} <span className="kpi-unit">€/mois</span></strong>
              <span className="kpi-sub">min {fmt(kpiStats?.min_price)} € — max {fmt(kpiStats?.max_price)} €</span>
            </div>
            <div className="kpi-card kpi-card--accent">
              <span className="kpi-label">Prix moyen / m²</span>
              <strong className="kpi-value">{fmt(kpiStats?.avg_prix_m2, 1)} <span className="kpi-unit">€/m²</span></strong>
              <span className="kpi-sub">surface moy. {fmt(kpiStats?.avg_surface, 1)} m²</span>
            </div>
          </section>

          {/* ── Content Grid ── */}
          <div className="content-grid">

            {/* Map panel */}
            <section className="dash-card map-panel" id="map">
              <div className="dash-card-header">
                <div>
                  <h2>Carte Île-de-France</h2>
                  <p>
                    {activeFilter
                      ? `Zones correspondant au filtre « ${activeFilter} »`
                      : 'Cliquez sur une zone pour filtrer les annonces'}
                  </p>
                </div>
                <div className="header-badges">
                  <span className="badge">
                    {activeFilter ? fmt(totalListings) : fmt(globalStats?.total)} annonces
                  </span>
                  <span className="badge">
                    {activeFilter
                      ? (chartStats?.by_postal?.length ?? '—')
                      : (globalStats?.by_postal?.length ?? '—')} zones
                  </span>
                </div>
              </div>
              <MapSection
                statsByPostal={
                  activeFilter
                    ? (chartStats?.by_postal || [])
                    : (globalStats?.by_postal || [])
                }
                onSelectZone={filterByPostal}
                selectedPostal={activeFilter}
                hasActiveFilter={!!activeFilter}
              />
            </section>

            {/* Right panel */}
            <aside className="right-panel">

              {/* Top zones */}
              {globalStats?.by_postal?.length > 0 && (
                <div className="dash-card">
                  <div className="dash-card-header"><h2>Top zones</h2></div>
                  <div className="zones-table">
                    <div className="zones-table-head">
                      <span>Code postal</span><span>Annonces</span><span>Loyer moy.</span>
                    </div>
                    {globalStats.by_postal.slice(0, 8).map(zone => (
                      <button
                        key={zone.code_postal}
                        className={`zones-table-row${activeFilter === zone.code_postal ? ' zones-table-row--active' : ''}`}
                        onClick={() => filterByPostal(zone.code_postal)}
                      >
                        <span className="zone-code">{zone.code_postal}</span>
                        <span>{zone.count}</span>
                        <span>{fmt(zone.avg_price)} €</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="dash-card" id="guide">
                <div className="dash-card-header"><h2>Comment ça marche ?</h2></div>
                <div className="steps-list">
                  {[
                    { n: '01', icon: '🔍', title: 'Recherchez', desc: 'Entrez une ville ou code postal en Île-de-France' },
                    { n: '02', icon: '📊', title: 'Analysez',   desc: 'Consultez prix, surface et disponibilités' },
                    { n: '03', icon: '📈', title: 'Évaluez',    desc: 'Comparez les zones pour trouver le meilleur rapport qualité/prix' },
                  ].map(s => (
                    <div className="step-item" key={s.n}>
                      <div className="step-num">{s.n}</div>
                      <div className="step-body">
                        <div className="step-icon">{s.icon}</div>
                        <div><h3>{s.title}</h3><p>{s.desc}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </aside>
          </div>

          {/* ── Listings Table ── */}
          <section className="dash-card listings-section" id="listings">
            <div className="dash-card-header">
              <div>
                <h2>Annonces</h2>
                <p>
                  {activeFilter
                    ? `${fmt(totalListings)} résultats pour « ${activeFilter} »`
                    : `${fmt(totalListings)} annonces au total`}
                </p>
              </div>
              {activeFilter && (
                <button className="clear-btn" onClick={clearFilter}>Effacer le filtre</button>
              )}
            </div>

            {apiLoading ? (
              <div className="listings-loading">
                <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
              </div>
            ) : listings.length === 0 ? (
              <p className="listings-empty">Aucune annonce trouvée.</p>
            ) : (
              <>
                <div className="listings-table-wrap">
                  <table className="listings-table">
                    <thead>
                      <tr>
                        <th>Lieu</th>
                        <th>CP</th>
                        <th>Prix</th>
                        <th>Surface</th>
                        <th>Prix/m²</th>
                        <th>Pièces</th>
                        <th>Chambres</th>
                        <th>Étage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map(l => (
                        <tr key={l.id} className="listing-row">
                          <td className="listing-lieu" title={l.lieu}>{l.lieu}</td>
                          <td>
                            <button className="cp-badge" onClick={() => filterByPostal(l.code_postal)}>
                              {l.code_postal}
                            </button>
                          </td>
                          <td className="listing-price">{fmt(l.price)} €</td>
                          <td>{fmt(l.surface, 1)} m²</td>
                          <td className="listing-ppm2">{l.prix_m2 ? `${fmt(l.prix_m2, 1)} €` : '—'}</td>
                          <td>{l.pieces != null ? Math.round(l.pieces) : '—'}</td>
                          <td>{l.chambres != null ? Math.round(l.chambres) : '—'}</td>
                          <td>{l.etage != null ? Math.round(l.etage) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={!prevPage}
                    onClick={() => paginate(-1)}
                  >← Précédent</button>
                  <span className="page-info">Page {currentPage} / {totalPages}</span>
                  <button
                    className="page-btn"
                    disabled={!nextPage}
                    onClick={() => paginate(1)}
                  >Suivant →</button>
                </div>
              </>
            )}
          </section>

          <ChartsSection
            byPostal={
              activeFilter
                ? (chartStats?.by_postal || [])
                : (chartStats?.by_postal?.length ? chartStats.by_postal : (globalStats?.by_postal || []))
            }
            contextLabel={activeFilter ? `Filtre actif: ${activeFilter}` : 'Répartition par code postal (top 12)'}
            isLoading={!chartStats && !globalStats}
            apiError={apiError}
            hasActiveFilter={!!activeFilter}
            onSelectZone={filterByPostal}
          />

          {/* Footer bar */}
          <footer className="dash-footer">
            <span>
              <span className="footer-logo-text">Logement</span>
              <span className="footer-logo-accent">IDF</span>
            </span>
            <span>Aide à la recherche de logement étudiant · Île-de-France</span>
            <span>© 2026 Tous droits réservés</span>
          </footer>

        </main>
      </div>
    </div>
  )
}

export default App
