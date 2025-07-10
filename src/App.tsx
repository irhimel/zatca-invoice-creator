import MainLayout from './components/Layout/MainLayout';
import { AppSettingsProvider } from './context/AppSettingsContext';
import { LanguageProvider } from './context/LanguageContext';
import { ZATCAProvider } from './context/ZATCAContext';

export default function App() {
  return (
    <AppSettingsProvider>
      <LanguageProvider>
        <ZATCAProvider>
          <MainLayout />
        </ZATCAProvider>
      </LanguageProvider>
    </AppSettingsProvider>
  );
}
