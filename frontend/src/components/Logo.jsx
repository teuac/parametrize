import React from 'react'
import styled from 'styled-components'
import logoSrc from '../pages/logo.png'
import { theme } from '../theme'

// a component that paints a PNG/SVG logo with the theme accent color using CSS mask
const MaskedLogo = styled.div`
  width: ${props => props.size || '140px'};
  height: auto;
  aspect-ratio: 1 / 1;
  background-color: ${props => props.color || theme.colors.accent};
  -webkit-mask-image: url(${logoSrc});
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
  mask-image: url(${logoSrc});
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  display: block;
`;

export default function Logo({ size, color }) {
  return <MaskedLogo size={size} color={color} aria-hidden="true" />
}
