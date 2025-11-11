import React from 'react';

export default function DashedDivider({ className = '', style = {} }) {
  return <hr className={`dashed-divider ${className}`.trim()} style={style} />;
}
