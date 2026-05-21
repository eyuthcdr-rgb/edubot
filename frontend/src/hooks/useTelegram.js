import { useEffect } from 'react';

export function useTelegram() {
  const tg   = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user || {};

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand(); // full-screen
    }
  }, []);

  return {
    tg,
    user,
    colorScheme: tg?.colorScheme || 'light',
    themeParams: tg?.themeParams  || {},
    close:       () => tg?.close(),
    showAlert:   (msg) => tg?.showAlert(msg),
  };
}
