import { toast } from "@/components/ui/toast";
import { Artifact } from "@/components/chat/create-artifact";
import { ImageEditor } from "@/components/chat/image-editor";
import { Copy, RotateCcw, RotateCw } from "lucide-react";

export const imageArtifact = new Artifact({
  actions: [
    {
      description: "View Previous version",
      icon: <RotateCcw />,
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
    },
    {
      description: "View Next version",
      icon: <RotateCw />,
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
    },
    {
      description: "Copy image to clipboard",
      icon: <Copy />,
      onClick: ({ content }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${content}`;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
              ]);
            }
          }, "image/png");
        };
        toast.add({
          type: "success",
          description: "Copied image to clipboard!",
        });
      },
    },
  ],
  content: ImageEditor,
  description: "Useful for image generation",
  kind: "image",
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-imageDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: "streaming",
      }));
    }
  },
  toolbar: [],
});
