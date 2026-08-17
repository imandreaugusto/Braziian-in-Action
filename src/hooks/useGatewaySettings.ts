import { useState, useEffect } from 'react';
import { GatewaySettings } from '../types';

export const DEFAULT_GATEWAY_SETTINGS: GatewaySettings = {
  subscriptionPrice: 10.00,
  provider: 'mercadopago',
  apiKey: 'APP_USR-2169459029228708-081608-82116b1a8792ae738a35037a5a5a7439-542978321',
  publicKey: 'APP_USR-8e1cc10a-7434-40b2-a222-3fbb4b6555e2',
  clientId: '2169459029228708',
  clientSecret: 'wSBs26zRaJHF6myQPjt2dvux1fYDFjCg',
  webhookSecret: '',
  pixKey: 'brazilianinaction@gmail.com',
  pixKeyType: 'email',
  beneficiaryName: 'Brazilian in Action Idiomas',
  city: 'São Paulo'
};

export function useGatewaySettings(): [GatewaySettings, (newSettings: GatewaySettings | ((prev: GatewaySettings) => GatewaySettings)) => void] {
  const [settings, setSettings] = useState<GatewaySettings>(() => {
    try {
      const saved = localStorage.getItem('bia_gateway_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If parsed contains older test tokens or is missing production keys/client secrets, upgrade to production default
        if (parsed.apiKey?.startsWith('TEST-') || !parsed.apiKey || !parsed.clientId) {
          const merged = { 
            ...DEFAULT_GATEWAY_SETTINGS, 
            ...parsed, 
            apiKey: DEFAULT_GATEWAY_SETTINGS.apiKey, 
            publicKey: DEFAULT_GATEWAY_SETTINGS.publicKey,
            clientId: DEFAULT_GATEWAY_SETTINGS.clientId,
            clientSecret: DEFAULT_GATEWAY_SETTINGS.clientSecret
          };
          localStorage.setItem('bia_gateway_settings', JSON.stringify(merged));
          return merged;
        }
        return { ...DEFAULT_GATEWAY_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Error reading gateway settings from localStorage:', e);
    }
    return DEFAULT_GATEWAY_SETTINGS;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('bia_gateway_settings');
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error reading gateway settings from event:', e);
      }
    };

    window.addEventListener('bia_gateway_settings_changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('bia_gateway_settings_changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateSettings = (newSettingsOrFn: GatewaySettings | ((prev: GatewaySettings) => GatewaySettings)) => {
    setSettings((prev) => {
      const resolved = typeof newSettingsOrFn === 'function' ? newSettingsOrFn(prev) : newSettingsOrFn;
      try {
        localStorage.setItem('bia_gateway_settings', JSON.stringify(resolved));
        window.dispatchEvent(new Event('bia_gateway_settings_changed'));
      } catch (e) {
        console.error('Error saving gateway settings to localStorage:', e);
      }
      return resolved;
    });
  };

  return [settings, updateSettings];
}
