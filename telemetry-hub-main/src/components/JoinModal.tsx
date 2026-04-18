import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

interface JoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinModal = ({ open, onOpenChange }: JoinModalProps) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    // Frontend-only stub. Backend wiring (Lovable Cloud leads table) coming later.
    setTimeout(() => {
      toast({
        title: "you're on the list",
        description: "syndicate intel inbound. backend capture activates at launch.",
      });
      setEmail("");
      setSubmitting(false);
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hud-panel border-hud/40 max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-hud" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-hud">SYNDICATE ACCESS</span>
          </div>
          <DialogTitle className="text-xl">join the grand 13</DialogTitle>
          <DialogDescription className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            drop your email · receive verified picks
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          <Input
            type="email"
            required
            placeholder="you@syndicate.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-mono bg-secondary/50 border-hud/30"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-accent text-primary-foreground"
          >
            {submitting ? "transmitting..." : "lock me in →"}
          </Button>
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground text-center">
            21+ · play responsibly
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
