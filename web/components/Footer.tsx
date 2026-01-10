import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

const Footer = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <footer className="py-8 border-t border-gray-200 dark:border-gray-700 text-muted-foreground opacity-60">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
      <div className="flex justify-center items-center gap-4">
        <span>© {`${new Date().getFullYear()}`} Prism Market. {t('footer.copyright')}</span>
        
        <span className="text-border">•</span>
        <button onClick={() => navigate('/terms')} className="hover:underline bg-transparent border-none p-0 m-0 text-inherit cursor-pointer">{t('footer.termsOfService')}</button>
        <span className="text-border">•</span>
        <button onClick={() => navigate('/privacy')} className="hover:underline bg-transparent border-none p-0 m-0 text-inherit cursor-pointer">{t('footer.privacyPolicy')}</button>
        <span className="text-border">•</span>
        <button onClick={() => navigate('/contact')} className="hover:underline bg-transparent border-none p-0 m-0 text-inherit cursor-pointer">{t('footer.contactUs')}</button>
      </div>
      <div className="mt-4">
        <span>
          Built with ❤️ by <a href="https://prism.market" target="_blank" rel="noopener noreferrer" className="hover:underline">Prism Market Labs</a>
        </span>
      </div>
      </div>
    </footer>
  )
}

export default Footer
