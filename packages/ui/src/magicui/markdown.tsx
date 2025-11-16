/* eslint-disable @typescript-eslint/no-explicit-any */

import { marked } from 'marked';
import { memo, type PropsWithChildren, useId, useMemo } from 'react';
import ReactMarkdown, {
  type Components,
  type ExtraProps,
} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { CodeBlock, CodeBlockCode } from './code-block';

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Partial<Components>;
  /**
   * Apply prose styling for rich text rendering (optimized for chat)
   * @default false
   */
  prose?: boolean;
};

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token: { raw: string }) => token.raw);
}

function extractLanguage(className?: string): string {
  if (!className) return 'plaintext';
  const match = className.match(/language-(\w+)/);
  if (match?.[1]) return match[1];
  return 'plaintext';
}

const INITIAL_COMPONENTS: Partial<Components> = {
  a: function LinkComponent({
    children,
    href,
    ...props
  }: PropsWithChildren<ExtraProps & { href?: string }>) {
    return (
      <a
        className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        {...props}
      >
        {children}
      </a>
    );
  },
  code: function CodeComponent({
    className,
    children,
    ...props
  }: PropsWithChildren<ExtraProps & { className?: string }>) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line;

    if (isInline) {
      return (
        <code
          className={cn(
            'bg-muted text-foreground rounded-md px-1.5 py-0.5 font-mono text-[0.875em]',
            className,
          )}
          {...props}
        >
          {children}
        </code>
      );
    }

    const language = extractLanguage(className);

    return (
      <CodeBlock className={className}>
        <CodeBlockCode code={children as string} language={language} />
      </CodeBlock>
    );
  },
  pre: function PreComponent({ children }: PropsWithChildren<ExtraProps>) {
    return <>{children}</>;
  },
};

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string;
    components?: Partial<Components>;
  }) {
    return (
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    );
  },
  function propsAreEqual(
    prevProps: { content: string },
    nextProps: { content: string },
  ) {
    return prevProps.content === nextProps.content;
  },
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
  prose = false,
}: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);

  return (
    <div
      className={cn(
        prose && [
          'prose prose-sm dark:prose-invert max-w-none',
          // Optimize spacing for chat
          'prose-p:my-2 prose-p:leading-relaxed',
          'prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold',
          'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
          'prose-ul:my-2 prose-ol:my-2',
          'prose-li:my-0.5',
          'prose-blockquote:my-2 prose-blockquote:border-l-primary',
          'prose-code:text-foreground prose-code:bg-muted',
          'prose-pre:my-2 prose-pre:bg-card prose-pre:border prose-pre:border-border',
          'prose-table:my-2',
          'prose-img:my-2 prose-img:rounded-lg',
          // Link styling
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
          // Strong and emphasis
          'prose-strong:font-semibold prose-strong:text-foreground',
          'prose-em:italic',
          // HR
          'prose-hr:my-4 prose-hr:border-border',
        ],
        className,
      )}
    >
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          components={components}
          content={block}
          // biome-ignore lint/suspicious/noArrayIndexKey: index is stable for parsed markdown blocks
          key={`${blockId}-block-${index}`}
        />
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = 'Markdown';

export { Markdown };
