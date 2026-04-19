import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Mic, Image, X, Square, Reply } from "lucide-react";
import { useAudioRecorder, formatDuration } from "@/hooks/useAudioRecorder";
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
          {/* Add more button */}
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
          <Button
            size="icon"
            onClick={handleSendImages}
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
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleImageSelect}
          className="hidden"
        />
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
            multiple
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
