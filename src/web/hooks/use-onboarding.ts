import { useEffect, useState } from 'react';

interface UseOnboardingReturn {
  show: boolean;
  complete: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const [show, setShow] = useState(false);

  useEffect(() => {
    window.api.getSetting<boolean>('onboarding-complete', false).then((done) => {
      setShow(!done);
    });
  }, []);

  const complete = (): void => {
    setShow(false);
  };

  return { show, complete };
}
