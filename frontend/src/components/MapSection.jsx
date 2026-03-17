import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const IDF_CENTER = [48.75, 2.45]
const IDF_ZOOM = 10
const GEO_FIELDS = 'nom,code,codesPostaux,codeDepartement'

const PARIS_ARR_CODES = Array.from({ length: 20 }, (_, i) =>
  `751${String(i + 1).padStart(2, '0')}`,
)

function isArrCode(code) {
  return /^751\d{2}$/.test(String(code))
}

function priceColor(avgPrice, minP, maxP) {
  if (!avgPrice) {
    return { fill: 'rgba(255,255,255,0.05)', stroke: 'rgba(255,255,255,0.1)' }
  }

  const t = Math.min((avgPrice - minP) / (maxP - minP || 1), 1)
  const r = Math.round(93 + t * 162)
  const g = Math.round(224 - t * 224)
  const b = Math.round(191 - t * 191)
  const a = 0.2 + t * 0.6

  return {
    fill: `rgba(${r},${g},${b},${a})`,
    stroke: `rgba(${r},${g},${b},0.65)`,
  }
}

function zoneInfoHtml(name, cp, zone) {
  const noData = '<div class="mp-nodata">Aucune annonce disponible</div>'
  const pricePerM2 =
    zone?.avg_price && zone?.avg_surface
      ? `${Math.round(zone.avg_price / zone.avg_surface)} EUR`
      : '-'

  return `
    <div class="mp-title">${name}</div>
    <div class="mp-cp">${cp || '-'}</div>
    ${
      zone
        ? `
      <div class="mp-grid">
        <span>Annonces</span><strong>${zone.count}</strong>
        <span>Loyer moyen</span><strong>${Math.round(zone.avg_price)} EUR/mois</strong>
        <span>Surface moy.</span><strong>${zone.avg_surface} m2</strong>
        <span>Prix / m2</span><strong>${pricePerM2}</strong>
      </div>
      <div class="mp-hint">Cliquez pour filtrer les annonces</div>
    `
        : noData
    }
  `
}

async function fetchGeoJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${url}`)
  }

  const raw = await response.json()

  if (raw?.type === 'FeatureCollection') return raw.features || []
  if (raw?.type === 'Feature') return [raw]
  if (Array.isArray(raw)) {
    return raw.flatMap((item) =>
      item?.geometry
        ? [
            {
              type: 'Feature',
              geometry: item.geometry,
              properties: { ...item, geometry: undefined },
            },
          ]
        : [],
    )
  }

  return []
}

async function loadAllGeoFeatures() {
  const all = await fetchGeoJson(
    `https://geo.api.gouv.fr/communes?codeRegion=11&fields=${GEO_FIELDS}&geometry=contour&format=geojson`,
  )

  const communes = []
  const arrMap = new Map()

  for (const feature of all) {
    if (!feature?.geometry) continue
    const code = String(feature.properties?.code || '')
    if (!code) continue

    if (isArrCode(code)) {
      arrMap.set(code, feature)
    } else if (code !== '75056') {
      communes.push(feature)
    }
  }

  const missing = PARIS_ARR_CODES.filter((code) => !arrMap.has(code))
  if (missing.length > 0) {
    const fetched = await Promise.all(
      missing.map(async (code) => {
        try {
          const features = await fetchGeoJson(
            `https://geo.api.gouv.fr/communes/${code}?fields=${GEO_FIELDS}&geometry=contour&format=geojson`,
          )
          const feature =
            features.find((item) => String(item.properties?.code) === code) || features[0]
          if (feature) {
            if (!feature.properties) feature.properties = {}
            if (!feature.properties.code) feature.properties.code = code
          }
          return feature || null
        } catch {
          return null
        }
      }),
    )

    fetched.forEach((feature) => {
      if (feature?.geometry) {
        arrMap.set(String(feature.properties.code), feature)
      }
    })
  }

  const arrondissements = PARIS_ARR_CODES.map((code) => arrMap.get(code)).filter(Boolean)
  return [...communes, ...arrondissements]
}

export default function MapSection({
  statsByPostal = [],
  onSelectZone,
  selectedPostal,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const featuresRef = useRef([])
  const statsRef = useRef(statsByPostal)
  const selectedRef = useRef(selectedPostal)
  const priceMapRef = useRef({ map: {}, minP: 500, maxP: 8000 })
  const clearHoverRef = useRef(() => {})

  statsRef.current = statsByPostal
  selectedRef.current = selectedPostal

  const [geoLoading, setGeoLoading] = useState(true)
  const [geoError, setGeoError] = useState('')

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    const onPress = () => {
      clearHoverRef.current()
      if (document.activeElement && element.contains(document.activeElement)) {
        document.activeElement.blur()
      }
    }

    element.addEventListener('mousedown', onPress, true)
    return () => element.removeEventListener('mousedown', onPress, true)
  }, [])

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return undefined

    mapRef.current = L.map(containerRef.current, {
      center: IDF_CENTER,
      zoom: IDF_ZOOM,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: 'OSM contributors, CARTO',
      maxZoom: 19,
    }).addTo(mapRef.current)

    loadAllGeoFeatures()
      .then((features) => {
        featuresRef.current = features
        setGeoLoading(false)
        renderLayer()
      })
      .catch((error) => {
        console.error(error)
        setGeoError('Impossible de charger la carte geographique.')
        setGeoLoading(false)
      })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  function buildPriceMap() {
    const map = {}
    let minP = Infinity
    let maxP = -Infinity

    statsRef.current.forEach((zone) => {
      if (!zone.avg_price) return
      map[zone.code_postal] = zone
      if (zone.avg_price < minP) minP = zone.avg_price
      if (zone.avg_price > maxP) maxP = zone.avg_price
    })

    if (!Number.isFinite(minP)) {
      minP = 500
      maxP = 8000
    }

    return { map, minP, maxP }
  }

  function getZone(feature, priceMap) {
    const codes = feature.properties?.codesPostaux || []
    for (const cp of codes) {
      if (priceMap[cp]) return { cp, data: priceMap[cp] }
    }
    return { cp: codes[0] || '', data: null }
  }

  function renderLayer() {
    if (!mapRef.current || featuresRef.current.length === 0) return

    layerRef.current?.remove()

    const { map: priceMap, minP, maxP } = buildPriceMap()
    priceMapRef.current = { map: priceMap, minP, maxP }

    function clearHoverStyles() {
      if (!layerRef.current) return

      const { map: currentPriceMap, minP: currentMin, maxP: currentMax } = priceMapRef.current

      layerRef.current.eachLayer((layer) => {
        const feature = layer.feature
        if (!feature) return

        const { cp, data } = getZone(feature, currentPriceMap)
        const isSelected = cp === selectedRef.current
        const { fill, stroke } = priceColor(data?.avg_price, currentMin, currentMax)

        layer.setStyle({
          fillColor: fill,
          fillOpacity: 1,
          color: isSelected ? '#ff2020' : stroke,
          weight: isSelected ? 2.5 : 0.6,
        })
      })
    }

    clearHoverRef.current = clearHoverStyles

    layerRef.current = L.geoJSON(
      { type: 'FeatureCollection', features: featuresRef.current },
      {
        style(feature) {
          const { cp, data } = getZone(feature, priceMap)
          const isSelected = cp === selectedRef.current
          const { fill, stroke } = priceColor(data?.avg_price, minP, maxP)

          return {
            fillColor: fill,
            fillOpacity: 1,
            color: isSelected ? '#ff2020' : stroke,
            weight: isSelected ? 2.5 : 0.6,
          }
        },
        onEachFeature(feature, layer) {
          const { cp, data } = getZone(feature, priceMap)
          const name = feature.properties?.nom || ''

          layer.options.bubblingMouseEvents = true

          layer.bindTooltip(`<div class="map-popup">${zoneInfoHtml(name, cp, data)}</div>`, {
            className: 'dark-tooltip',
            sticky: true,
            opacity: 1,
            direction: 'auto',
            offset: [12, 0],
          })

          layer.bindPopup(`<div class="map-popup">${zoneInfoHtml(name, cp, data)}</div>`, {
            className: 'dark-popup',
            maxWidth: 230,
            autoClose: true,
            closeOnClick: true,
          })

          layer.on({
            mouseover(event) {
              event.target.setStyle({ weight: 2, color: 'rgba(255,255,255,0.55)' })
              event.target.bringToFront()
            },
            mouseout(event) {
              const isSelected = cp === selectedRef.current
              const { stroke } = priceColor(data?.avg_price, minP, maxP)
              event.target.setStyle({
                color: isSelected ? '#ff2020' : stroke,
                weight: isSelected ? 2.5 : 0.6,
              })
            },
            click() {
              if (!cp) return
              layer.openPopup()
              onSelectZone?.(cp)
            },
          })
        },
      },
    ).addTo(mapRef.current)
  }

  useEffect(() => {
    if (featuresRef.current.length > 0) {
      renderLayer()
    }
  }, [statsByPostal, selectedPostal])

  useEffect(() => {
    if (!selectedPostal || !layerRef.current) return

    layerRef.current.eachLayer((layer) => {
      const codes = layer.feature?.properties?.codesPostaux || []
      if (!codes.includes(selectedPostal)) return

      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        mapRef.current?.fitBounds(bounds, { padding: [30, 30] })
      }
    })
  }, [selectedPostal])

  return (
    <div className="imap-wrap">
      {geoLoading && (
        <div className="imap-overlay">
          <div className="imap-loader">
            <span />
            <span />
            <span />
          </div>
          <p>Chargement de la carte...</p>
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
          <span className="imap-legend-label">Eleve</span>
        </div>
      )}
    </div>
  )
}
