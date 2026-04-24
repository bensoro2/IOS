import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Image, X, Reply } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatInputProps {
  onSendText: (text: string) => Promise<void>;
  onSendMedia: (file: Blob | Blob[], type: "image" | "audio") => Promise<void>;
  isSending: boolean;
  replyTo?: { id: string; preview: string } | null;
  onCancelReply?: () => void;
}

const ChatInput = ({ onSendText, onSendMedia, isSending, replyTo, onCancelReply }: ChatInputProps) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);

  // Ref always holds the latest handleSendText — solves closure issue in native listener
  const handleSendRef = useRef<() => void>(() => {});

  const handleSendText = async () => {
    if (!message.trim() || isSending) return;
    const text = message.trim();
    setMessage("");
    await onSendText(text);
  };

  handleSendRef.current = handleSendText;

  // Native touchstart with { passive: false } is required on iOS WKWebView
  // React synthetic events are passive — preventDefault() is silently ignored
  useEffect(() => {
    const btn = sendBtnRef.current;
    if (!btn) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // prevents keyboard from closing (works only in non-passive listener)
      handleSendRef.current();
    };

    btn.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => btn.removeEventListener("touchstart", onTouchStart);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!incoming.length) return;

    const files = incoming.slice(0, Math.max(0, 10 - selectedFiles.length));
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImages((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendImages = async () => {
    if (!selectedFiles.length || isSending) return;
    await onSendMedia(selectedFiles, "image");
    setSelectedFiles([]);
    setPreviewImages([]);
    setMessage("");
  };

  const cancelImagePreview = () => {
    setSelectedFiles([]);
    setPreviewImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Image preview mode
  if (previewImages.length > 0) {
    return (
      <div className="flex-shrink-0 px-4 py-3 bg-card border-t border-border">
        <div className="flex flex-wrap gap-2 mb-2">
          {previewImages.map((src, index) => (
            <div key={index} className="relative">
              <img
                src={src}
                alt={`Preview ${index + 1}`}
                className="h-24 w-24 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground hover:bg-muted"
          >
            <Image className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={cancelImagePreview} className="flex-shrink-0 text-destructive">
            <X className="w-5 h-5" />
          </Button>
          <Input
            placeholder={t("chat.addCaption")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-muted border-0"
            disabled={isSending}
          />
          <Button size="icon" onClick={handleSendImages} disabled={isSending} className="flex-shrink-0">
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
        <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
      </div>
    );
  }

  // Normal mode
  return (
    <div className="flex-shrink-0 bg-card border-t border-border">
      {replyTo && (
        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          <Reply className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate flex-1">{t("chat.replyingTo")} {replyTo.preview}</span>
          <button onClick={onCancelReply} className="p-1 hover:bg-muted rounded-full">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
          <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isSending} className="flex-shrink-0">
            <Image className="w-5 h-5" />
          </Button>
          <Input
            ref={inputRef}
            placeholder={t("chat.placeholder")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-muted border-0"
            disabled={isSending}
          />
          {/* ref + native touchstart (non-passive) keeps keyboard open on iOS */}
          <Button
            ref={sendBtnRef}
            size="icon"
            onClick={handleSendText}
            disabled={!message.trim() || isSending}
            className="flex-shrink-0"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
