export const COLORS = {
  primary:    '#0052CC',
  primaryDark:'#003D99',
  primaryLight:'#E8F0FF',
  accent:     '#00B8D9',
  success:    '#36B37E',
  warning:    '#FFAB00',
  danger:     '#FF5630',
  bg:         '#F4F5F7',
  surface:    '#FFFFFF',
  border:     '#DFE1E6',
  text:       '#172B4D',
  textSub:    '#5E6C84',
  textLight:  '#8993A4',
};

export const STATUS = {
  received:   { label: 'تم الاستلام',        color: '#FFAB00', bg: '#FFF7E6' },
  washing:    { label: 'جاري الغسيل',        color: '#0052CC', bg: '#E8F0FF' },
  drying:     { label: 'جاري التجفيف',       color: '#00B8D9', bg: '#E6FCFF' },
  ready:      { label: 'جاهز للاستلام',      color: '#36B37E', bg: '#E3FCEF' },
  delivered:  { label: 'تم التسليم',         color: '#5E6C84', bg: '#F4F5F7' },
  cancelled:  { label: 'ملغي',               color: '#FF5630', bg: '#FFEBE6' },
};
