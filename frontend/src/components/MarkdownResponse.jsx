import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownResponse({ children }) {
  return (
    <div className="max-h-80 overflow-y-auto break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-2 text-lg font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 text-base font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 font-semibold">{children}</h3>,
          p: ({ children }) => <p className="mb-2 whitespace-pre-wrap leading-6 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          del: ({ children }) => <del className="text-muted-foreground">{children}</del>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-3 text-muted-foreground">{children}</blockquote>,
          a: ({ children, href }) => <a className="break-all text-primary underline" href={href}>{children}</a>,
          pre: ({ children }) => <pre className="mb-2 max-w-full overflow-x-auto rounded-lg bg-muted p-3 text-xs last:mb-0">{children}</pre>,
          code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
