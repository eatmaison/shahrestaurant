import type { CSSProperties } from "react";

const EMBERS = [8, 18, 31, 44, 57, 69, 82, 92];
const TRAILS = [12, 28, 47, 64, 79];

/** Decorative CSS animation keeps the server and browser markup identical. */
export function Atmosphere() {
  return <div className="site-atmosphere" aria-hidden="true">
    <div className="site-atmosphere__mesh" /><div className="site-atmosphere__grain" />
    <div className="site-atmosphere__embers">{EMBERS.map((left, index) => <span key={left} className="site-atmosphere__ember" style={{ left: `${left}%`, animationDuration: `${5.4 + index % 4 * .7}s`, animationDelay: `${index * .55}s`, "--ember-drift": `${index % 2 ? 18 : -14}px` } as CSSProperties} />)}</div>
    <div className="site-atmosphere__trails">{TRAILS.map((left, index) => <span key={left} className="site-atmosphere__trail" style={{ left: `${left}%`, animationDuration: `${7 + index}s`, animationDelay: `${index * .9}s` }} />)}</div>
  </div>;
}
