// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AIChatSidebar from './AIChatSidebar';
import React from 'react';
import { Note } from '../types';

describe('AIChatSidebar', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(cleanup);

  const mockNote: Note = {
    id: '1',
    content: 'Test note content',
    createdAt: '2023-01-01',
    timestamp: 1234567890
  };

  it('should render nothing when not open', () => {
    const { container } = render(
      <AIChatSidebar 
        isOpen={false} 
        note={null} 
        onClose={() => {}} 
        onSaveToNote={async () => {}} 
        generateAIResponse={async () => ''}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render header and note content when open', () => {
    render(
      <AIChatSidebar 
        isOpen={true} 
        note={mockNote} 
        onClose={() => {}} 
        onSaveToNote={async () => {}} 
        generateAIResponse={async () => ''}
      />
    );
    expect(screen.getByText(/AI 深度对话/i)).toBeDefined();
    expect(screen.getByText(/Test note content/i)).toBeDefined();
  });

  it('should call generateAIResponse for initial insight', async () => {
    const generateAIResponse = vi.fn().mockResolvedValue('Initial AI Insight');
    render(
      <AIChatSidebar 
        isOpen={true} 
        note={mockNote} 
        onClose={() => {}} 
        onSaveToNote={async () => {}} 
        generateAIResponse={generateAIResponse}
      />
    );
    
    expect(generateAIResponse).toHaveBeenCalledWith(expect.stringContaining('针对这条笔记内容'));
    expect(await screen.findByText('Initial AI Insight')).toBeDefined();
  });

  it('should send user message and display AI response', async () => {
    const generateAIResponse = vi.fn()
        .mockResolvedValueOnce('Initial AI Insight')
        .mockResolvedValueOnce('AI Answer');
    
    render(
      <AIChatSidebar 
        isOpen={true} 
        note={mockNote} 
        onClose={() => {}} 
        onSaveToNote={async () => {}} 
        generateAIResponse={generateAIResponse}
      />
    );

    // Wait for initial insight
    await screen.findByText('Initial AI Insight');

    const input = screen.getByPlaceholderText(/输入你的想法/i);
    const sendButton = screen.getByLabelText('发送');
    
    // Type and send
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.click(sendButton);

    expect(screen.getByText('Hello AI')).toBeDefined();
    expect(generateAIResponse).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('AI Answer')).toBeDefined();
  });

  it('should generate and save summary when ending session', async () => {
    const generateAIResponse = vi.fn()
        .mockResolvedValueOnce('Initial AI Insight')
        .mockResolvedValueOnce('Hello AI response')
        .mockResolvedValueOnce('Summary of discussion');
    const onSaveToNote = vi.fn();
    
    render(
      <AIChatSidebar 
        isOpen={true} 
        note={mockNote} 
        onClose={() => {}} 
        onSaveToNote={onSaveToNote} 
        generateAIResponse={generateAIResponse}
      />
    );

    await screen.findByText('Initial AI Insight');

    // Send a message
    fireEvent.change(screen.getByPlaceholderText(/输入你的想法/i), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByLabelText('发送'));
    await screen.findByText('Hello AI response');

    // Click End Session
    fireEvent.click(screen.getByText('结束讨论'));
    
    expect(generateAIResponse).toHaveBeenCalledTimes(3);
    expect(await screen.findByText('Summary of discussion')).toBeDefined();

    // Click Save
    fireEvent.click(screen.getByText('保存并同步至笔记'));
    expect(onSaveToNote).toHaveBeenCalledWith('Summary of discussion');
  });

  it('should switch between summary and transcript saving modes', async () => {
    const generateAIResponse = vi.fn().mockResolvedValue('Summary');
    const onSaveToNote = vi.fn();
    
    render(
      <AIChatSidebar 
        isOpen={true} 
        note={mockNote} 
        onClose={() => {}} 
        onSaveToNote={onSaveToNote} 
        generateAIResponse={generateAIResponse}
      />
    );

    await screen.findByText('Summary'); // Initial insight, might be mocked differently or reused

    // Simulate chat history
    const input = screen.getByPlaceholderText(/输入你的想法/i);
    const sendButton = screen.getByLabelText('发送');
    fireEvent.change(input, { target: { value: 'User Question' } });
    fireEvent.click(sendButton);
    // AI response would come here... let's just proceed to End Session

    // Click End Session
    fireEvent.click(screen.getByText('结束讨论'));
    await screen.findByText('讨论总结与洞见'); // Wait for summary mode

    // Check for switch button (implementation pending)
    const switchButton = screen.getByRole('button', { name: /切换为/i });
    
    // Switch to Transcript
    fireEvent.click(switchButton);
    expect(await screen.findByText('对话实录')).toBeDefined();
    // Verify transcript content contains User Question
    expect(screen.getAllByText(/User Question/).length).toBeGreaterThan(0);

    // Switch back to Summary
    fireEvent.click(switchButton);
    expect(await screen.findByText('讨论总结与洞见')).toBeDefined();
  });

  it('should render markdown in AI messages', async () => {
    const generateAIResponse = vi.fn().mockResolvedValue('This is **bold** and *italic*');
    render(
      <AIChatSidebar 
        isOpen={true} 
        note={mockNote} 
        onClose={() => {}} 
        onSaveToNote={async () => {}} 
        generateAIResponse={generateAIResponse}
      />
    );
    
    // The text content should be present, and if rendered by react-markdown, 
    // it will be inside appropriate HTML tags.
    // In JSDOM, we can check for the existence of strong/em tags.
    const boldElement = await screen.findByText('bold');
    expect(boldElement.tagName).toBe('STRONG');
    
    const italicElement = await screen.findByText('italic');
    expect(italicElement.tagName).toBe('EM');
  });
});
