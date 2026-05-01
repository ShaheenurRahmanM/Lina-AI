import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Conversation, Message } from '../types';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import TypingIndicator from '../components/TypingIndicator';
import EmptyChatScreen from '../components/EmptyChatScreen';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useGroqStream } from '../hooks/useGroqStream';
import toast from 'react-hot-toast';

interface ChatPageProps {
  conversation: Conversation | null;
  online: boolean;
}

function ChatPage({ conversation, online }: ChatPageProps) {
  const { messages, addMessage, refreshMessages, updateMessageContent } = useChatStore();
  const { settings } = useSettingsStore();
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { speak } = useTextToSpeech();
  const { startRecognition, listening, stopRecognition } = useSpeechRecognition({
    onResult: (value) => setDraft(value),
  });
  const { streamResponse, abort } = useGroqStream();

  const activeMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  );

  // Auto-scroll to bottom on new messages / streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, streamedText]);

  const handleSend = async (content?: string) => {
    const payload = (content ?? draft).trim();
    if (!conversation || !payload || generating) return;

    if (!listening) {
      setVoiceModeActive(false);
    }

    setGenerating(true);
    setStreamedText('');
    setDraft('');

    // Add user message first so it appears immediately
    const userMessage = await addMessage({
      conversationId: conversation.id,
      role: 'user',
      content: payload,
    });

    // Build history including the new user message
    const history: Message[] = [
      {
        id: 'sys',
        conversationId: conversation.id,
        role: 'system',
        content: settings.systemPrompt || conversation.systemPrompt,
        createdAt: Date.now(),
        edited: false,
        status: 'sent',
      },
      ...activeMessages,
      userMessage,
    ];

    let currentStream = '';

    try {
      await streamResponse(
        history,
        conversation.model || settings.model,
        (chunk) => {
          currentStream += chunk;
          setStreamedText(currentStream);
        },
        (errorMessage) => {
          toast.error(errorMessage, { duration: 6000 });
        },
        {
          temperature: conversation.temperature ?? settings.temperature,
          maxTokens: conversation.maxTokens ?? settings.maxTokens,
        }
      );

      if (currentStream.trim()) {
        await addMessage({
          conversationId: conversation.id,
          role: 'assistant',
          content: currentStream,
        });
        if (settings.voiceEnabled && voiceModeActive) {
          speak(currentStream, {
            voiceName: settings.voiceName,
            rate: settings.voiceRate,
            pitch: settings.voicePitch,
            volume: settings.voiceVolume,
            lang: 'en-US',
          });
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error((error as Error).message || 'Something went wrong. Please try again.');
      }
    } finally {
      setStreamedText('');
      setGenerating(false);
      await refreshMessages();
    }
  };

  const handleStop = () => {
    abort();
    setGenerating(false);
    setStreamedText('');
  };

  const handleMicToggle = () => {
    if (listening) {
      stopRecognition();
      return;
    }

    setVoiceModeActive(true);
    startRecognition();
  };

  const handleRetry = () => {
    if (!conversation || generating) return;
    const lastUser = [...activeMessages].reverse().find((m) => m.role === 'user');
    if (lastUser) handleSend(lastUser.content);
  };

  if (!conversation) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
            <Sparkles size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">No conversation</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Open the sidebar and create a new chat to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Chat header */}
      <div className="shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600 dark:text-sky-400">
            {online ? 'Connected' : 'Offline'}
          </p>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
            {conversation.title || 'New Conversation'}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {conversation.model || settings.model}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-4 sm:space-y-6">
          {activeMessages.length === 0 && !generating && (
            <EmptyChatScreen onPromptSelect={(p) => handleSend(p)} />
          )}

          {activeMessages
            .filter((m) => m.role !== 'system')
            .map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onEdit={(content) => updateMessageContent(message.id, content)}
              />
            ))}

          {/* Streaming response */}
          {streamedText && (
            <ChatMessage
              message={{
                id: 'streaming',
                conversationId: conversation.id,
                role: 'assistant',
                content: streamedText,
                createdAt: Date.now(),
                edited: false,
                status: 'streaming',
              }}
              onEdit={() => {}}
            />
          )}

          {/* Typing indicator before first chunk */}
          {generating && !streamedText && <TypingIndicator label="Thinking…" />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            value={draft}
            onChange={(value) => {
              setDraft(value);
              if (!listening) setVoiceModeActive(false);
            }}
            onSend={() => handleSend()}
            onMicToggle={handleMicToggle}
            isListening={listening}
            isGenerating={generating}
            onStop={handleStop}
            onRetry={handleRetry}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
