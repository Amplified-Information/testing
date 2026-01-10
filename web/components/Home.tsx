import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

const Home = () => {

  const navigate = useNavigate()
  const { t } = useTranslation()
  const highlights = [1, 2, 3, 4, 5].map(i => t(`hero.titleHighlight${i}`))
  const [highlightIdx, setHighlightIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightIdx(idx => (idx + 1) % highlights.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [highlights.length])

  return (
    <div className="relative overflow-hidden bg-transparent">
      <br/>
      <br/>
      {/* Content */}
      <div className="space-y-8 relative z-10">
        <div className="space-y-4">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
            <span style={{ color: 'var(--prism-yellow)' }}>
              {t('hero.title')}
            </span>
            <span
              key={highlightIdx}
              className="block text-primary opacity-0 translate-y-2 animate-fadeinup"
              style={{ animation: 'fadeinup 0.4s cubic-bezier(0.4,0,0.2,1) 0.1s forwards' }}
            >
              {highlights[highlightIdx]}
            </span>
          <style>
          {`
          @keyframes fadeinup {
            from { opacity: 0; transform: translateY(0.5rem); }
            to { opacity: 1; transform: translateY(0); }
          }
          `}
          </style>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-lg">
            {t('hero.description')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            className="btn-primary btn-xl"
            onClick={async () => {
              navigate('/explore')
            }}
          >
            {t('hero.startTrading')}
          </button>
          <button className="btn-outline btn-xl">
            {t('hero.exploreMarkets')}
          </button>
        </div>
      </div>

          {/* Stats Cards */}
          {/* <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      {stat.subtitle && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {stat.subtitle}
                        </p>
                      )}
                      <p className="text-2xl font-bold mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <stat.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div> */}

      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
    </div>
  )
}


export default Home
