import { useI18n, type LocaleKey } from '../../i18n';
import { Icon } from '../Icon';
import styles from './LanguageToggle.module.css';

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  const toggleLanguage = () => {
    const newLocale: LocaleKey = locale === 'en-US' ? 'en-US' : 'en-US';
    setLocale(newLocale);
  };

  return (
    <button
      className={styles.toggle}
      onClick={toggleLanguage}
      title={t.language.label}
      aria-label={t.language.label}
    >
      <Icon name="globe" size="sm" className={styles.icon} />
      <span className={styles.text}>
        {locale === 'en-US' ? t.language.en : t.language.zh}
      </span>
    </button>
  );
}





