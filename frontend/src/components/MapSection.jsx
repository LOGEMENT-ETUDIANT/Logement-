// Interactive map via OpenStreetMap embed - no extra dependencies
// Île-de-France bbox: minLon, minLat, maxLon, maxLat
const MAP_EMBED_URL = 'https://www.openstreetmap.org/export/embed.html?bbox=1.4%2C48.1%2C3.4%2C49.0&layer=mapnik'

export default function MapSection() {
  return (
    <section className="map-section" id="map">
      <div className="container">
        <div className="map-header fade-in">
          <h2 className="section-title">
            <span className="title-number">02</span>
            Explorez l&apos;Île-de-France
          </h2>
          <p className="section-subtitle">
            Parcourez la région et découvrez les zones couvertes par notre analyse
          </p>
        </div>
        <div className="map-wrapper fade-in-up">
          <iframe
            title="Carte Île-de-France"
            src={MAP_EMBED_URL}
            className="map-iframe"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a
            href="https://www.openstreetmap.org/#map=9/48.65/2.41"
            target="_blank"
            rel="noopener noreferrer"
            className="map-link"
          >
            Ouvrir en grand
          </a>
        </div>
      </div>
    </section>
  )
}
