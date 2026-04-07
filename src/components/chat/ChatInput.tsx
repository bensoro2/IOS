import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Mic, Image, X, Square, Reply } from "lucide-react";
import { useAudioRecorder, formatDuration } from "@/hooks/useAudioRecorder";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatInputProps {
  onSendText: (text: string) => Promise<void>;
  onSendMedia: (file: Blob, type: "image" | "audio") => Promise<void>;
  isSending: boolean;
  replyTo?: { id: string; preview: string } | null;
  onCancelReply?: () => void;
}

const ChatInput = ({ onSendText, onSendMedia, isSending, replyTo, onCancelReply }: ChatInputProps) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const handleSendText = async () => {
    if (!message.trim() || isSending) return;
    const text = message.trim();
    setMessage("");
    await onSendText(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = async () => {
    if (!selectedFile || isSending) return;
    await onSendMedia(selectedFile, "image");
    setSelectedFile(null);
    setPreviewImage(null);
  };

  const cancelImagePreview = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        await onSendMedia(audioBlob, "audio");
      }
    } else {
      try {
        await startRecording();
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    }
  };

  // Image preview mode
  if (previewImage) {
    return (
      <div className="flex-shrink-0 px-4 py-3 bg-card border-t border-border">
        <div className="relative inline-block mb-2">
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-40 rounded-lg"
          />
          <button
            onClick={cancelImagePreview}
            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("chat.addCaption")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-muted border-0"
            disabled={isSending}
          />
          <Button
            size="icon"
            onClick={handleSendImage}
            disabled={isSending}
            className="flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Recording mode
  if (isRecording) {
    return (
      <div className="flex-shrink-0 px-4 py-3 bg-card border-t border-border">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={cancelRecording}
            className="flex-shrink-0 text-destructive"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              {t("chat.recording")} {formatDuration(recordingDuration)}
            </span>
          </div>
          <Button
            size="icon"
            onClick={handleMicPress}
            disabled={isSending}
            className="flex-shrink-0 bg-destructive hover:bg-destructive/90"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Square className="w-4 h-4 fill-current" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Normal mode
  return (
    <div className="flex-shrink-0 bg-card border-t border-border">
      {/* Reply preview */}
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
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageSelect}
          className="hidden"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="flex-shrink-0"
        >
          <Image className="w-5 h-5" />
        </Button>
        <Input
          placeholder={t("chat.placeholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-muted border-0"
          disabled={isSending}
        />
        {message.trim() ? (
          <Button
            size="icon"
            onClick={handleSendText}
            disabled={!message.trim() || isSending}
            className="flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleMicPress}
            disabled={isSending}
            className="flex-shrink-0"
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
    </div>
  );
};

export default ChatInput;
