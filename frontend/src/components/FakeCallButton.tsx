import { useState } from "react";
import { Phone } from "lucide-react";
import FakeCall from "./FakeCall";

const FakeCallButton = () => {
  const [showFakeCall, setShowFakeCall] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowFakeCall(true)}
        className="fixed bottom-6 right-24 z-50 w-12 h-12 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground flex items-center justify-center shadow-lg transition-all"
        title="Fake Call"
      >
        <Phone className="w-5 h-5" />
      </button>

      {showFakeCall && <FakeCall onClose={() => setShowFakeCall(false)} />}
    </>
  );
};

export default FakeCallButton;
