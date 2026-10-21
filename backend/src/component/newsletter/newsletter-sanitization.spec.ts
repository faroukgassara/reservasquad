import { describe, it, expect } from '@jest/globals';
import { sanitizeNewsletterBody } from './newsletter.service';

describe('Newsletter HTML Sanitization (Backend - sanitize-html)', () => {
  it('strips script tags and malicious event handlers', () => {
    const maliciousHtml =
      '<p>Hello</p><script>alert("xss")</script><img src="x" onerror="alert(1)" /><a href="javascript:alert(1)">Click</a>';
    const sanitized = sanitizeNewsletterBody(maliciousHtml);

    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('alert("xss")');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).toContain('<p>Hello</p>');
    expect(sanitized).toContain('<img src="x" />');
    expect(sanitized).toContain('<a>Click</a>');
  });

  it('strips dangerous CSS expressions and javascript urls from style attributes', () => {
    const maliciousStyle =
      '<div style="color: red; background-image: url(\'javascript:alert(1)\'); width: expression(alert(1));">Styled</div>';
    const sanitized = sanitizeNewsletterBody(maliciousStyle);

    expect(sanitized).toContain('color:red');
    expect(sanitized).not.toContain('javascript');
    expect(sanitized).not.toContain('expression');
  });

  it('preserves rich newsletter styling and layout', () => {
    const richContent =
      '<div style="background-color:#EEF2FF;border-left:4px solid #253165;padding:14px 18px;border-radius:8px;margin:18px 0;color:#1E293B;">' +
      '<strong style="color:#253165;">Important</strong> News content' +
      '</div>';
    const sanitized = sanitizeNewsletterBody(richContent);

    expect(sanitized).toContain('background-color:#EEF2FF');
    expect(sanitized).toContain('border-left:4px solid #253165');
    expect(sanitized).toContain('Important');
  });

  it('preserves file attachment cards with download and target attributes', () => {
    const attachmentCard =
      '<p style="margin:16px 0;"><a href="/newsletter/media/report.pdf" target="_blank" download class="file-attachment-card" style="display:inline-flex;color:#253165;">Download PDF</a></p>';
    const sanitized = sanitizeNewsletterBody(attachmentCard);

    expect(sanitized).toContain('href="/newsletter/media/report.pdf"');
    expect(sanitized).toContain('target="_blank"');
    expect(sanitized).toContain('download');
    expect(sanitized).toContain('class="file-attachment-card"');
  });

  it('preserves tables, images, and standard formatting', () => {
    const tableAndImage =
      '<table style="width:100%;border-collapse:collapse;"><tr style="background:#F8FAFC;"><th style="border:1px solid #E5E7EB;padding:10px;">Header</th></tr></table>' +
      '<img src="https://example.com/image.png" alt="Test" style="max-width:100%;height:auto;display:block;" />';
    const sanitized = sanitizeNewsletterBody(tableAndImage);

    expect(sanitized).toContain('<table');
    expect(sanitized).toContain('<th');
    expect(sanitized).toContain('Header');
    expect(sanitized).toContain('src="https://example.com/image.png"');
    expect(sanitized).toContain('alt="Test"');
  });

  it('handles empty strings and plain text', () => {
    expect(sanitizeNewsletterBody('')).toBe('');
    expect(sanitizeNewsletterBody('Simple text without HTML')).toBe(
      'Simple text without HTML',
    );
  });
});
