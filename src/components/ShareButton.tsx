import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  clicks: number;
}

export const ShareButton = ({ clicks }: ShareButtonProps) => {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareText = `I just hit ${clicks.toLocaleString()} clicks on Click Empire! 🎯 Can you beat my score?`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Click Empire",
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast({
          title: "Copied to clipboard!",
          description: "Share your achievement with friends",
        });
      } catch (error) {
        toast({
          title: "Share link",
          description: shareUrl,
        });
      }
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      Share Your Score
    </Button>
  );
};
