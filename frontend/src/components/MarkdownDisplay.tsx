import React from 'react';
import { Card, Button, Space, message } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownDisplayProps {
  content: string;
  title?: string;
  filename?: string;
}

const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({
  content,
  title,
  filename = 'ai_response.md',
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      message.success('已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('下载成功');
    } catch (error) {
      message.error('下载失败');
    }
  };

  // Custom components for markdown rendering
  const components: Components = {
    h1: ({ children }) => (
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid #475569', paddingBottom: '8px', color: '#e2e8f0' }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginTop: '24px', marginBottom: '12px', color: '#cbd5e1' }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '20px', marginBottom: '10px', color: '#cbd5e1' }}>
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p style={{ marginBottom: '12px', lineHeight: '1.7', color: '#cbd5e1' }}>{children}</p>
    ),
    ul: ({ children }) => (
      <ul style={{ marginBottom: '12px', paddingLeft: '24px', color: '#cbd5e1' }}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol style={{ marginBottom: '12px', paddingLeft: '24px', color: '#cbd5e1' }}>{children}</ol>
    ),
    li: ({ children }) => (
      <li style={{ marginBottom: '6px', color: '#cbd5e1' }}>{children}</li>
    ),
    code: ({ inline, children, ...props }: any) => {
      if (inline) {
        return (
          <code
            style={{
              backgroundColor: '#334155',
              color: '#e2e8f0',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '0.9em',
              fontFamily: 'monospace',
            }}
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          style={{
            display: 'block',
            backgroundColor: '#1e293b',
            color: '#e2e8f0',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '0.9em',
            fontFamily: 'monospace',
            overflowX: 'auto',
            marginBottom: '12px',
            border: '1px solid #475569',
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    blockquote: ({ children }) => (
      <blockquote
        style={{
          borderLeft: '4px solid #3b82f6',
          paddingLeft: '16px',
          marginLeft: 0,
          marginBottom: '12px',
          color: '#94a3b8',
        }}
      >
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #475569',
          }}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th
        style={{
          backgroundColor: '#1e293b',
          padding: '8px 12px',
          border: '1px solid #475569',
          textAlign: 'left',
          fontWeight: 600,
          color: '#94a3b8',
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td style={{ padding: '8px 12px', border: '1px solid #475569', color: '#cbd5e1' }}>
        {children}
      </td>
    ),
    strong: ({ children }) => (
      <strong style={{ fontWeight: 600, color: '#e2e8f0' }}>{children}</strong>
    ),
    em: ({ children }) => (
      <em style={{ fontStyle: 'italic', color: '#cbd5e1' }}>{children}</em>
    ),
  };

  if (!content) {
    return null;
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded mt-4">
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
        {title && <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">{title}</h3>}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-mono flex items-center gap-2 rounded transition-colors border border-slate-600"
            title="复制到剪贴板"
          >
            <CopyOutlined />
            复制
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-mono flex items-center gap-2 rounded transition-colors border border-slate-600"
            title="下载为Markdown文件"
          >
            <DownloadOutlined />
            下载
          </button>
        </div>
      </div>
      <div
        className="p-4"
        style={{
          maxHeight: '600px',
          overflowY: 'auto',
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownDisplay;
