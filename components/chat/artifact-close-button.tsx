import { memo, useCallback } from "react";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { X } from "lucide-react";

function PureArtifactCloseButton() {
  const { setArtifact } = useArtifact();
  const handleClick = useCallback(() => {
    setArtifact((currentArtifact) =>
      currentArtifact.status === "streaming"
        ? {
            ...currentArtifact,
            isVisible: false,
          }
        : { ...initialArtifactData, status: "idle" },
    );
  }, [setArtifact]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="artifact-close-button"
          onClick={handleClick}
          variant="ghost"
          size="icon"
        >
          <X />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Close</TooltipContent>
    </Tooltip>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
