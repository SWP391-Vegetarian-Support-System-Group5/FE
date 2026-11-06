/** Decorative foliage; never intercepts navigation or screen readers. */
export default function BotanicalAccent({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 220 300" fill="none" className={`vm-botanical pointer-events-none select-none ${className}`}>
    <path d="M22 294C88 231 80 137 175 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <g fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="1.2">
      <path d="M55 251C7 246 0 214 7 179C45 185 66 208 55 251Z" />
      <path d="M68 220C116 224 148 199 149 163C110 163 77 181 68 220Z" />
      <path d="M83 183C38 174 28 140 39 108C76 120 94 148 83 183Z" />
      <path d="M102 143C148 155 182 132 192 99C152 91 119 108 102 143Z" />
      <path d="M127 101C89 88 85 55 97 25C132 41 144 70 127 101Z" />
      <path d="M149 63C181 65 207 40 210 8C179 11 154 31 149 63Z" />
    </g>
    <g stroke="currentColor" strokeOpacity=".5" strokeWidth=".8">
      <path d="M55 251L16 194M68 220L137 175M83 183L47 122M102 143L177 110M127 101L102 40M149 63L200 20" />
    </g>
  </svg>;
}
