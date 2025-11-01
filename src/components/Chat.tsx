import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  username: string;
  message: string;
  is_premium: boolean;
  created_at: string;
}

interface ChatProps {
  userId: string;
  username: string;
  isPremium: boolean;
}

export const Chat = ({ userId, username, isPremium }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);

      if (data) {
        setMessages(data);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("chat_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Auto scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    // Check for emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu;
    const hasEmoji = emojiRegex.test(newMessage);

    if (hasEmoji && !isPremium) {
      toast({
        title: "Premium Feature 👑",
        description: "Emojis are available for premium subscribers only!",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.from("chat_messages").insert({
        user_id: userId,
        username,
        message: newMessage.trim(),
        is_premium: isPremium,
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-2 border-border rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b-2 border-border bg-secondary/30">
        <h3 className="font-bold text-lg text-primary">Live Chat</h3>
        {!isPremium && (
          <div className="text-xs text-muted-foreground mt-1">
            Premium users can use emojis 👑
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4 bg-secondary/10" ref={scrollRef}>
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-card rounded-lg p-3 border border-border break-words"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-semibold ${msg.is_premium ? "text-yellow-600" : "text-primary"}`}>
                  {msg.username}
                </span>
                {msg.is_premium && (
                  <span className="text-yellow-500">👑</span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-foreground">{msg.message}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};