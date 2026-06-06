import { sanitizeHtml } from "@/lib/utils/sanitizeHtml";

type Props = { body: string };

function isHtmlContent(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

/** Renders blog body as HTML or plain text */
export function BlogArticleBody({ body }: Props) {
  if (!body.trim()) {
    return <p className="text-muted-foreground">محتوایی برای نمایش وجود ندارد.</p>;
  }

  if (isHtmlContent(body)) {
    return (
      <div
        className="blog-prose text-base leading-8 text-foreground/90"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
      />
    );
  }

  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="blog-prose space-y-5 text-base leading-8 text-foreground/90">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
