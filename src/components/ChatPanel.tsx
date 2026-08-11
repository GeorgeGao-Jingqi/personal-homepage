import type { ChatMessage, Language, ProfileContent } from "../types";
import { EditableText } from "./EditableText";

export function ChatPanel({
  profile,
  language,
  editable,
  messages,
  input,
  onInputChange,
  onSend,
  onClose,
  onTitleChange,
  onIntroChange,
}: {
  profile: ProfileContent;
  language: Language;
  editable: boolean;
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onIntroChange: (value: string) => void;
}) {
  return (
    <section className="chat-panel" aria-label={profile.aiTitle}>
      <div className="chat-header">
        <div>
          <span className="chat-kicker">{language === "zh" ? "开放问答" : "OPEN Q&A"}</span>
          <EditableText value={profile.aiTitle} onChange={onTitleChange} editable={editable} as="h2" />
          <EditableText value={profile.aiIntro} onChange={onIntroChange} editable={editable} as="p" multiline />
        </div>
        <button type="button" onClick={onClose} aria-label={language === "zh" ? "关闭聊天" : "Close chat"}>
          ×
        </button>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <p className={`message ${message.role}`} key={`${message.role}-${index}`}>
            {message.text}
          </p>
        ))}
      </div>
      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <input
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={language === "zh" ? "问问我的成长背景或项目..." : "Ask about my story or projects..."}
        />
        <button type="submit" aria-label={language === "zh" ? "发送消息" : "Send message"}>
          <span aria-hidden="true">↗</span>
        </button>
      </form>
    </section>
  );
}
