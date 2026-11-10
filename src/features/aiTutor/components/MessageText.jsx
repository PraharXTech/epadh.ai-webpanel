import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

// An AI answer as formatted text. Web upgrade of the mobile "markdown-lite" renderer: real
// markdown (bold, lists, code, tables, links) through react-markdown, which never renders raw
// HTML, so a model reply can not inject markup or script. Single newlines stay line breaks
// (the answers use "• " lines), and links open in a new tab.
const components = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
};

export default function MessageText({ text, className = '' }) {
  return (
    <div className={`chat-md ${className}`}>
      <Markdown remarkPlugins={[remarkBreaks]} components={components}>
        {text}
      </Markdown>
    </div>
  );
}
