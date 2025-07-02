import { MoveRight, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function CTA() {
  const navigate = useNavigate();
  return (
    <div className="w-full py-8 md:py-12">
      <div className="container mx-auto">
        <div className="flex flex-col text-center bg-muted rounded-md p-4 md:p-10 gap-8 items-center">
          <div>
            <Badge className="bg-blue-600 text-white">Get started</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular">
              Try Zentia today!
            </h3>
            <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl">
              Caring for your mental health shouldn't be complicated. Forget scattered notes, generic apps, or gaps between sessions. Zentia streamlines support, making therapy more connected, personalized, and effortless for everyone.
            </p>
          </div>
          <div className="flex flex-row gap-4">
            <Button className="gap-4" variant="outline">
              Jump on a call <PhoneCall className="w-4 h-4" />
            </Button>
            <Button className="gap-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/startup')}>
              Get started <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CTA };
