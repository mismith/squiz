import React from 'react';

import './Device.scss';

const variants = [
  'tv',
  'desktop',
  'laptop',
  'tablet',
  'phone',
];
export default function Device({
  variant = undefined,
  orientation = 'portrait',
  children = null,
  ...props
}) {
  const [variantIndex, setVariantIndex] = React.useState(0);
  if (variant === undefined) {
    variant = variants[variantIndex];
  }

  return (
    <div
      onClick={() => setVariantIndex(v => (v += 1) % variants.length)}
      className={`container ${variant} ${orientation}`}
      {...props}
    >
      <div className="foot"></div>
      <div className="head"></div>
      <div className="device">
        <div className="screen">{children}</div>
      </div>
    </div>
  );
}
