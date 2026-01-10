import React from 'react';
import { DISCLAIMER_TEXT } from '@/lib/utils';

const Disclaimer = () => {
  return (
    <footer className="disclaimer-footer mt-auto" data-testid="disclaimer-footer">
      <p className="max-w-4xl mx-auto">
        <span className="font-medium">Information shown is for reference only.</span>
        <br />
        {DISCLAIMER_TEXT}
      </p>
    </footer>
  );
};

export default Disclaimer;
