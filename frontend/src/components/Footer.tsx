import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold text-foreground">SafeHer</span>
        </div>
        <p className="text-sm text-muted-foreground">Predicting danger. Protecting lives.</p>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-heading font-semibold text-sm text-foreground">Quick Links</h4>
        {["Heatmap", "Route", "Dashboard", "Community", "Resources"].map((l) => (
          <Link key={l} to={`/${l.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {l}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Built for India. Powered by AI.</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 w-fit">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-xs text-secondary">99.4% LightGBM Accuracy</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
