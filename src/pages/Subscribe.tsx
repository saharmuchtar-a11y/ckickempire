import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Crown, Sparkles, Zap } from "lucide-react";

const Subscribe = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "2x Click Multiplier",
      description: "Every click counts as 2 clicks! Double your impact",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Chat Emojis",
      description: "Use emojis in chat messages to express yourself",
    },
    {
      icon: <Crown className="h-6 w-6" />,
      title: "Premium Badge",
      description: "Golden crown badge next to your username",
    },
    {
      icon: <Check className="h-6 w-6" />,
      title: "Exclusive Status",
      description: "Stand out as a premium member in the community",
    },
  ];

  return (
    <div className="min-h-screen space-bg">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Game
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-primary mb-4">
              Premium Membership
            </h1>
            <p className="text-xl text-muted-foreground">
              Boost your clicking power and unlock exclusive features
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-card border-2 border-primary rounded-lg p-8 shadow-lg mb-12">
            <div className="text-center mb-8">
              <div className="inline-block bg-primary/20 rounded-full px-4 py-2 mb-4">
                <span className="text-primary font-bold">LIMITED OFFER</span>
              </div>
              <div className="text-6xl font-bold glow-primary mb-2">$4.99</div>
              <div className="text-muted-foreground">per month</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-muted rounded-lg"
                >
                  <div className="text-primary mt-1">{feature.icon}</div>
                  <div>
                    <h3 className="font-bold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              className="w-full text-lg box-glow-primary"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Premium
            </Button>
          </div>

          {/* FAQ */}
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-2xl font-bold glow-secondary mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Can I cancel anytime?</h3>
                <p className="text-muted-foreground">
                  Yes! You can cancel your subscription at any time. You'll keep
                  your premium benefits until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Do my stats carry over?</h3>
                <p className="text-muted-foreground">
                  Absolutely! All your clicks, achievements, and progress are
                  saved regardless of your subscription status.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">
                  We accept all major credit cards, PayPal, and various other
                  payment methods through our secure payment processor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;