import { X } from "lucide-react";
import { memo, useCallback } from "react";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
      <TooltipTrigger
        render={
          <Button
            data-testid="artifact-close-button"
            onClick={handleClick}
            size="icon"
            variant="ghost"
          />
        }
      >
        <X />
      </TooltipTrigger>
      <TooltipContent>Close artifact</TooltipContent>
    </Tooltip>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
