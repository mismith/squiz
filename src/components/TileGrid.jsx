import React from 'react';

export default ({ children, style, ...props }) => (
  <div
    style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', padding: 8, ...style }}
    {...props}
  >
    {children}
  </div>
);
