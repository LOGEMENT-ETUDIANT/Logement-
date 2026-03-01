import { useState, useEffect, useRef } from 'react'
import './App.css'
import MapSection from './components/MapSection'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('city') // 'city' or 'postal'
  const [scrollY, setScrollY] = useState(0)
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false)
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const aboutRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      setIsNavbarScrolled(currentScrollY > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          
          // Animate numbers if it's a stat card
          const statNumber = entry.target.querySelector('.stat-number')
          if (statNumber && !statNumber.dataset.animated) {
            const target = parseInt(statNumber.dataset.target)
            animateNumber(statNumber, 0, target, 2000)
            statNumber.dataset.animated = 'true'
          }
        }
      })
    }, observerOptions)

    const elements = document.querySelectorAll('.fade-in-up, .fade-in, .slide-in-left, .slide-in-right, .stat-card')
    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const animateNumber = (element, start, end, duration) => {
    const startTime = performance.now()
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(start + (end - start) * easeOutQuart)
      element.textContent = current
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        element.textContent = end
      }
    }
    requestAnimationFrame(animate)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log(`Searching for ${searchType}: ${searchQuery}`)
    }
  }

  const scrollProgress = Math.min((scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100, 100)

  return (
    <div className="app">
      {/* Scroll Progress Bar */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }}></div>

      {/* Navigation */}
      <nav className={`navbar ${isNavbarScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">
            <span className="logo-text">Logement</span>
            <span className="logo-accent">IDF</span>
          </div>
          <div className="nav-links">
            <a href="#how-it-works" className="nav-link">Comment ça marche</a>
            <a href="#map" className="nav-link">Carte</a>
            <a href="#about" className="nav-link">À propos</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" ref={heroRef}>
        <div className="hero-background">
          <div className="animated-shape shape-1"></div>
          <div className="animated-shape shape-2"></div>
          <div className="animated-shape shape-3"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title fade-in-up">
            Trouvez votre logement étudiant en{' '}
            <span className="highlight">
              <span className="highlight-text">Île-de-France</span>
              <span className="highlight-underline"></span>
            </span>
          </h1>
          <p className="hero-subtitle fade-in-up">
            Analysez le marché locatif selon votre zone
          </p>

          {/* Search - minimal inline bar */}
          <form className="search-form fade-in-up" onSubmit={handleSearch}>
            <div className="search-bar">
              <span className="search-type-toggle">
                <button type="button" className={`search-type-btn ${searchType === 'city' ? 'active' : ''}`} onClick={() => setSearchType('city')}>Ville</button>
                <span className="search-type-divider">/</span>
                <button type="button" className={`search-type-btn ${searchType === 'postal' ? 'active' : ''}`} onClick={() => setSearchType('postal')}>Code postal</button>
              </span>
              <input
                type="text"
                className="search-input"
                placeholder={searchType === 'city' ? 'Paris, Créteil…' : '75001, 94000…'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-submit" aria-label="Rechercher">→</button>
            </div>
          </form>

          {/* Scroll Indicator */}
          <div className="scroll-indicator fade-in">
            <div className="scroll-mouse">
              <div className="scroll-wheel"></div>
            </div>
            <span className="scroll-text">Découvrez plus</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card fade-in-up">
              <div className="stat-number" data-target="1000">0</div>
              <div className="stat-label">Logements analysés</div>
            </div>
            <div className="stat-card fade-in-up">
              <div className="stat-number" data-target="50">0</div>
              <div className="stat-label">Villes couvertes</div>
            </div>
            <div className="stat-card fade-in-up">
              <div className="stat-number" data-target="95">0</div>
              <div className="stat-label">% de précision</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="how-it-works" ref={featuresRef}>
        <div className="container">
          <div className="section-header fade-in">
            <h2 className="section-title">
              <span className="title-number">01</span>
              Comment ça marche ?
            </h2>
            <p className="section-subtitle">Trois étapes simples pour trouver votre logement idéal</p>
          </div>
          <div className="features-grid">
            <div className="feature-card slide-in-left">
              <div className="feature-card-inner">
                <div className="feature-number">01</div>
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">🔍</div>
                  <div className="icon-glow"></div>
                </div>
                <h3>Recherchez</h3>
                <p>
                  Entrez une ville ou un code postal en Île-de-France pour analyser
                  le marché locatif de la zone
                </p>
                <div className="feature-arrow">→</div>
              </div>
            </div>
            <div className="feature-card fade-in-up">
              <div className="feature-card-inner">
                <div className="feature-number">02</div>
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">📊</div>
                  <div className="icon-glow"></div>
                </div>
                <h3>Analysez</h3>
                <p>
                  Consultez des statistiques détaillées : prix moyen des loyers,
                  nombre de logements disponibles et indisponibles
                </p>
                <div className="feature-arrow">→</div>
              </div>
            </div>
            <div className="feature-card slide-in-right">
              <div className="feature-card-inner">
                <div className="feature-number">03</div>
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">📈</div>
                  <div className="icon-glow"></div>
                </div>
                <h3>Évaluez</h3>
                <p>
                  Découvrez la probabilité de trouver un logement dans votre zone,
                  exprimée en pourcentage pour évaluer la tension du marché
                </p>
                <div className="feature-arrow">→</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <MapSection />

      {/* About Section */}
      <section className="about" id="about" ref={aboutRef}>
        <div className="about-background"></div>
        <div className="container">
          <div className="about-content fade-in">
            <div className="section-header">
              <h2 className="section-title">
                <span className="title-number">03</span>
                À propos
              </h2>
            </div>
            <div className="about-text-wrapper">
              <p className="about-text">
                Cette plateforme vous aide à prendre de meilleures décisions avant
                d'entamer vos démarches de recherche de logement. Conçue spécialement
                pour les étudiants en Île-de-France, elle offre une vision claire et
                objective du marché locatif selon une zone géographique donnée.
              </p>
              <p className="about-text">
                Simple, pédagogique et accessible, notre application met l'accent sur
                l'expérience utilisateur pour vous accompagner dans votre recherche,
                même avec des contraintes de budget et de temps.
              </p>
            </div>
            <div className="about-features">
              <div className="about-feature-item">
                <div className="about-feature-icon">✓</div>
                <span>Gratuit et accessible</span>
              </div>
              <div className="about-feature-item">
                <div className="about-feature-icon">✓</div>
                <span>Données en temps réel</span>
              </div>
              <div className="about-feature-item">
                <div className="about-feature-icon">✓</div>
                <span>Interface intuitive</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <span className="logo-text">Logement</span>
                <span className="logo-accent">IDF</span>
              </div>
              <p>Aide à la recherche de logement étudiant en Île-de-France</p>
            </div>
            <div className="footer-links">
              <a href="#how-it-works">Comment ça marche</a>
              <a href="#map">Carte</a>
              <a href="#about">À propos</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Logement IDF. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
