import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const IDF_CENTER = [48.75, 2.45]
const IDF_ZOOM   = 10
const GEO_FIELDS = 'nom,code,codesPostaux,codeDepartement'

// Paris arrondissement INSEE codes: 75101 → 75120
const PARIS_ARR_CODES = Array.from({ length: 20 }, (_, i) =>
  `751${String(i + 1).padStart(2, '0')}`,
)
const isArrCode = (code) => /^751\d{2}$/.test(String(code))

// ── colour helper ─────────────────────────────────────────────────────────
function priceColor(avgPrice, minP, maxP) {
  if (!avgPrice) return { fill: 'rgba(255,255,255,0.05)', stroke: 'rgba(255,255,255,0.1)' }
  const t = Math.min((avgPrice - minP) / (maxP - minP || 1), 1)
  // teal (#5de0bf) → red (#ff0000)
  const r = Math.round(93  + t * 162)
  const g = Math.round(224 - t * 224)
  const b = Math.round(191 - t * 191)
  const a = 0.2 + t * 0.6
  return {
    fill:   `rgba(${r},${g},${b},${a})`,
    stroke: `rgba(${r},${g},${b},0.65)`,
  }
}

// ── shared HTML for tooltip (hover) and popup (click) ─────────────────────
function zoneInfoHtml(name, cp, zone) {
  const noData = `<div class="mp-nodata">Aucune annonce disponible</div>`
  return `
    <div class="mp-title">${name}</div>
    <div class="mp-cp">${cp || '—'}</div>
    ${zone ? `
      <div class="mp-grid">
        <span>Annonces</span>    <strong>${zone.count}</strong>
        <span>Loyer moyen</span> <strong>${Math.round(zone.avg_price)} €/mois</strong>
        <span>Surface moy.</span><strong>${zone.avg_surface} m²</strong>
        <span>Prix / m²</span>   <strong>${zone.avg_price && zone.avg_surface
          ? Math.round(zone.avg_price / zone.avg_surface) + ' €'
          : '—'}</strong>
      </div>
      <div class="mp-hint">Cliquez pour filtrer les annonces</div>
    ` : noData}
  `
}

// ── geo fetching ──────────────────────────────────────────────────────────
async function fetchGeoJson(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`HTTP ${r.status} — ${url}`)
  const raw = await r.json()
  if (raw?.type === 'FeatureCollection') return raw.features || []
  if (raw?.type === 'Feature')           return [raw]
  if (Array.isArray(raw))                return raw.flatMap(item => item?.geometry ? [{ type: 'Feature', geometry: item.geometry, properties: { ...item, geometry: undefined } }] : [])
  return []
}

async function loadAllGeoFeatures() {
  // 1 – Fetch all IDF communes (includes Paris as 75056 AND arrondissements as 751XX)
  const all = await fetchGeoJson(
    `https://geo.api.gouv.fr/communes?codeRegion=11&fields=${GEO_FIELDS}&geometry=contour&format=geojson`,
  )

  // 2 – Separate: regular communes vs Paris arrondissements
  const communes = []
  const arrMap   = new Map()

  for (const f of all) {
    if (!f?.geometry) continue
    const code = String(f.properties?.code || '')
    if (!code) continue

    if (isArrCode(code)) {
      arrMap.set(code, f)          // 75101–75120 → arrondissement
    } else if (code !== '75056') { // skip Paris commune blob
      communes.push(f)
    }
  }

  // 3 – Fetch any missing arrondissements individually
  const missing = PARIS_ARR_CODES.filter(c => !arrMap.has(c))
  if (missing.length > 0) {
    const fetched = await Promise.all(
      missing.map(async code => {
        try {
          const feats = await fetchGeoJson(
            `https://geo.api.gouv.fr/communes/${code}?fields=${GEO_FIELDS}&geometry=contour&format=geojson`,
          )
          const f = feats.find(x => String(x.properties?.code) === code) || feats[0]
          if (f) {
            if (!f.properties) f.properties = {}
            if (!f.properties.code) f.properties.code = code
          }
          return f || null
        } catch { return null }
      }),
    )
    fetched.forEach(f => {
      if (f?.geometry) arrMap.set(String(f.properties.code), f)
    })
  }

  // 4 – Ordered list of arrondissements (75101 first → 75120 last)
  const arrondissements = PARIS_ARR_CODES.map(c => arrMap.get(c)).filter(Boolean)

  return [...communes, ...arrondissements]
}

// ── component ──────────────────────────────────────────────────────────────
export default function MapSection({ statsByPostal = [], onSelectZone, selectedPostal }) {
  const containerRef  = useRef(null)
  const mapRef        = useRef(null)
  const layerRef      = useRef(null)
  const featuresRef   = useRef([])
  const statsRef      = useRef(statsByPostal)
  const selectedRef   = useRef(selectedPostal)
  const priceMapRef   = useRef({ map: {}, minP: 500, maxP: 8000 })
  const clearHoverRef = useRef(() => {})
  statsRef.current    = statsByPostal
  selectedRef.current = selectedPostal

  const [geoLoading, setGeoLoading] = useState(true)
  const [geoError,   setGeoError]   = useState('')

  // Clear hover + focus ring on any mousedown (capture = before Leaflet)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onPress = () => {
      clearHoverRef.current()
      if (document.activeElement && el.contains(document.activeElement)) {
        document.activeElement.blur()
      }
    }
    el.addEventListener('mousedown', onPress, true)
    return () => el.removeEventListener('mousedown', onPress, true)
  }, [])

  // ── init map once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    mapRef.current = L.map(containerRef.current, {
      center: IDF_CENTER,
      zoom: IDF_ZOOM,
      zoomControl: true,
    })
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OSM contributors © CARTO', maxZoom: 19 },
    ).addTo(mapRef.current)

    loadAllGeoFeatures()
      .then(features => {
        featuresRef.current = features
        setGeoLoading(false)
        renderLayer()
      })
      .catch(err => {
        console.error(err)
        setGeoError('Impossible de charger la carte géographique.')
        setGeoLoading(false)
      })

    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── price lookup ─────────────────────────────────────────────────────────
  function buildPriceMap() {
    const map = {}
    let minP = Infinity, maxP = -Infinity
    statsRef.current.forEach(z => {
      if (z.avg_price) {
        map[z.code_postal] = z
        if (z.avg_price < minP) minP = z.avg_price
        if (z.avg_price > maxP) maxP = z.avg_price
      }
    })
    if (!isFinite(minP)) { minP = 500; maxP = 8000 }
    return { map, minP, maxP }
  }

  // Match a feature to exactly one postal code with data
  function getZone(feature, pMap) {
    const codes = feature.properties?.codesPostaux || []
    for (const cp of codes) {
      if (pMap[cp]) return { cp, data: pMap[cp] }
    }
    return { cp: codes[0] || '', data: null }
  }

  // ── render GeoJSON layer ─────────────────────────────────────────────────
  function renderLayer() {
    if (!mapRef.current || featuresRef.current.length === 0) return
    layerRef.current?.remove()

    const { map: pMap, minP, maxP } = buildPriceMap()
    priceMapRef.current = { map: pMap, minP, maxP }

    function clearHoverStyles() {
      if (!layerRef.current) return
      const { map: pm, minP: min, maxP: max } = priceMapRef.current
      layerRef.current.eachLayer(layer => {
        const f = layer.feature
        if (!f) return
        const { cp, data } = getZone(f, pm)
        const sel = cp === selectedRef.current
        const { fill, stroke } = priceColor(data?.avg_price, min, max)
        layer.setStyle({
          fillColor:   fill,
          fillOpacity: 1,
          color:       sel ? '#ff2020' : stroke,
          weight:      sel ? 2.5 : 0.6,
        })
      })
    }
    clearHoverRef.current = clearHoverStyles

    layerRef.current = L.geoJSON(
      { type: 'FeatureCollection', features: featuresRef.current },
      {
        style(feature) {
          const { cp, data } = getZone(feature, pMap)
          const selected = cp === selectedRef.current
          const { fill, stroke } = priceColor(data?.avg_price, minP, maxP)
          return {
            fillColor:   fill,
            fillOpacity: 1,
            color:       selected ? '#ff2020' : stroke,
            weight:      selected ? 2.5 : 0.6,
          }
        },
        onEachFeature(feature, layer) {
          const { cp, data } = getZone(feature, pMap)
          const name = feature.properties?.nom || ''

          layer.options.bubblingMouseEvents = true

          layer.bindTooltip(
            `<div class="map-popup">${zoneInfoHtml(name, cp, data)}</div>`,
            {
              className:  'dark-tooltip',
              sticky:     true,
              opacity:    1,
              direction:  'auto',
              offset:     [12, 0],
            },
          )

          layer.bindPopup(
            `<div class="map-popup">${zoneInfoHtml(name, cp, data)}</div>`,
            { className: 'dark-popup', maxWidth: 230, autoClose: true, closeOnClick: true },
          )

          layer.on({
            mouseover(e) {
              e.target.setStyle({ weight: 2, color: 'rgba(255,255,255,0.55)' })
              e.target.bringToFront()
            },
            mouseout(e) {
              const sel = cp === selectedRef.current
              const { stroke } = priceColor(data?.avg_price, minP, maxP)
              e.target.setStyle({
                color:  sel ? '#ff2020' : stroke,
                weight: sel ? 2.5 : 0.6,
              })
            },
            click() {
              if (cp) {
                layer.openPopup()
                onSelectZone?.(cp)
              }
            },
          })
        },
      },
    ).addTo(mapRef.current)
  }

  // Re-render when stats or selection changes
  useEffect(() => {
    if (featuresRef.current.length > 0) renderLayer()
  }, [statsByPostal, selectedPostal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Zoom to selected postal code
  useEffect(() => {
    if (!selectedPostal || !layerRef.current) return
    layerRef.current.eachLayer(layer => {
      const codes = layer.feature?.properties?.codesPostaux || []
      if (codes.includes(selectedPostal)) {
        const b = layer.getBounds()
        if (b.isValid()) mapRef.current?.fitBounds(b, { padding: [30, 30] })
      }
    })
  }, [selectedPostal])

  return (
    <div className="imap-wrap">
      {geoLoading && (
        <div className="imap-overlay">
          <div className="imap-loader"><span /><span /><span /></div>
          <p>Chargement de la carte&hellip;</p>
        </div>
      )}
      {geoError && <div className="imap-overlay imap-error">{geoError}</div>}
      <div ref={containerRef} className="imap-container" tabIndex={-1} />
      {!geoLoading && (
        <div className="imap-legend">
          <span style={{ background: 'rgba(93,224,191,0.7)' }} />
          <span className="imap-legend-label">Bas</span>
          <span className="imap-legend-bar" />
          <span style={{ background: 'rgba(255,0,0,0.8)' }} />
          <span className="imap-legend-label">Élevé</span>
        </div>
      )}
    </div>
  )
}
