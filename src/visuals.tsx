const paths = {
  home: 'M3 10 12 3l9 7v10H3z M9 20v-7h6v7',
  orders: 'M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6',
  board: 'M3 5h18v14H3z M9 5v14 M15 5v14 M5 9h2 M11 12h2 M17 9h2',
  box: 'M4 7 12 3l8 4v10l-8 4-8-4z M4 7l8 4 8-4 M12 11v10',
  people: 'M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M5 20v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2z',
  arrow: 'M4 12h15 M13 6l6 6-6 6',
  check: 'm5 12 4 4L19 6',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  sew: 'M5 19 18 6 M16 4l4 4 M11 13l-3-3 M7 17l-3-3',
  list: 'M7 6h13 M7 12h13 M7 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
} as const

export type IconName = keyof typeof paths

export function Icon({ name }: { name: IconName }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>
}

export function Garment({ back = false, frontPleats = true, backPleats = true, embroidery = 'left' }: {
  back?: boolean; frontPleats?: boolean; backPleats?: boolean; embroidery?: 'left' | 'right' | 'back' | false
}) {
  return <svg className="garment" aria-hidden="true" viewBox="0 0 290 230" fill="none" strokeLinejoin="round">
    <path d="M0 192h290M0 146h290M0 100h290M0 54h290M46 0v230M95 0v230M145 0v230M195 0v230M244 0v230" stroke="currentColor" opacity=".15" />
    <path d="M108 29 78 40 47 63 24 119l44 21 15-29v103h124V111l15 29 44-21-23-56-31-23-30-11-16 10h-42z" fill="#f4e7ce" stroke="#a98a61" strokeWidth="2" />
    <path d="m47 63 36 48m160-48-36 48M28 109l45 21m189-21-45 21M83 202h124" stroke="#a98a61" strokeWidth="1.5" />
    {back ? <path d="M79 48q66 44 132 0m-66 24v131" stroke="#ba9c70" strokeWidth="1.5" />
      : <>
        <path d="m108 29 16 10h42l16-10-12 34-25-17-25 17zm37 17v168" stroke="#a98a61" fill="#ead8b4" strokeWidth="1.5" />
        <path d="M93 91h25v28H93zm79 0h25v28h-25zM93 152h25v27H93zm79 0h25v27h-25z" stroke="#a98a61" strokeWidth="1.5" />
        <path d="M150 78h.01m0 20h.01m0 20h.01m0 20h.01m0 20h.01m0 20h.01m0 20h.01" strokeLinecap="round" stroke="#85613f" strokeWidth="3" />
      </>}
    {embroidery && back === (embroidery === 'back') &&
      <path data-embroidery={embroidery} d="m181 102 14-7-7 12 5 5-11-4-5 7 2-9-5-4z"
        transform={embroidery === 'back' ? 'translate(-40 19)' : embroidery === 'right' ? 'translate(-80)' : undefined} fill="#4c6f75" />}
    {(back ? backPleats : frontPleats) && <path d="M124 76v116m5-116v116m32-116v116m5-116v116" stroke="#bc9d73" strokeWidth="1" strokeDasharray="3 2" />}
  </svg>
}
