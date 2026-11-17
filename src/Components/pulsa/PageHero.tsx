import BgVideo from "./BgVideo";

type Media = { src: string; webm?: string; poster: string };
type Props = {
  eyebrow: string;
  /** title lines; wrap a word in [brackets] to render it outlined */
  lines: string[];
  lead: string;
  media?: Media;
  children?: React.ReactNode;
};

const renderLine = (line: string) =>
  line.split(/(\[[^\]]+\])/).map((part, i) =>
    part.startsWith("[") ? (
      <span key={i} className="outline">
        {part.slice(1, -1)}
      </span>
    ) : (
      part
    ),
  );

/** Shared top section for inner pages: eyebrow, masked headline, lead, optional background clip. */
export default function PageHero({ eyebrow, lines, lead, media, children }: Props) {
  return (
    <section className="page-hero">
      {media && <BgVideo {...media} className="wash-strong" />}
      <div className="inner">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display page-title">
          {lines.map((l, i) => (
            <span className="line" key={i}>
              <span style={{ ["--i" as string]: i }}>{renderLine(l)}</span>
            </span>
          ))}
        </h1>
        <p className="page-lead">{lead}</p>
        {children}
      </div>
    </section>
  );
}
