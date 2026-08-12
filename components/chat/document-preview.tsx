"use client";

import { memo, useCallback, useMemo, useRef } from "react";
import useSWR from "swr";
import { useArtifact } from "@/hooks/use-artifact";
import type { Document } from "@/lib/db/schema";
import { cn, fetcher } from "@/lib/utils";
import type { ArtifactKind } from "./artifact";
import dynamic from "next/dynamic";
const CodeEditor = dynamic(
  () => import("./code-editor").then((mod) => mod.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    ),
  },
);

const SpreadsheetEditor = dynamic(
  () =>
    import("@/components/chat/sheet-editor").then(
      (mod) => mod.SpreadsheetEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    ),
  },
);
import { InlineDocumentSkeleton } from "./document-skeleton";
import { ImageEditor } from "./image-editor";
import { Editor } from "./text-editor";
import { TooltipContent, TooltipTrigger, Tooltip } from "../ui/tooltip";
import { Button } from "@/components/ui/button";
import { Code, Loader, Image, Maximize, File } from "lucide-react";
import { Spinner } from "../ui/spinner";

type DocumentToolOutput = {
  id: string;
  title: string;
  kind: ArtifactKind;
  content?: string;
};

type DocumentPreviewProps = {
  isReadonly: boolean;
  result?: Partial<DocumentToolOutput>;
  args?: Partial<DocumentToolOutput> & { isUpdate?: boolean };
};

export function DocumentPreview({
  isReadonly: _isReadonly,
  result,
  args,
}: DocumentPreviewProps) {
  const { artifact, setArtifact } = useArtifact();

  const { data: documents, isLoading: isDocumentsFetching } = useSWR<
    Document[]
  >(
    result
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/document?id=${result.id}`
      : null,
    fetcher,
  );

  const previewDocument = useMemo(() => documents?.[0], [documents]);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullScreen = useCallback(() => {
    const boundingBox = containerRef.current?.getBoundingClientRect();
    if (!boundingBox) return;

    setArtifact((currentArtifact) => ({
      ...currentArtifact,
      ...(result?.id && { documentId: result.id }),
      ...(result?.title && { title: result.title }),
      ...(result?.kind && { kind: result.kind }),
      boundingBox: {
        height: boundingBox.height,
        left: boundingBox.x,
        top: boundingBox.y,
        width: boundingBox.width,
      },
      isVisible: true,
    }));
  }, [setArtifact, result]);

  if (isDocumentsFetching) {
    const kind = result?.kind ?? args?.kind ?? artifact.kind;
    const title = result?.title ?? args?.title ?? artifact.title;

    return (
      <div className="w-full max-w-112.5 rounded-3xl border border-border/50 overflow-hidden">
        {title ? (
          <DocumentHeaderSkeleton
            isStreaming={true}
            kind={kind}
            title={title}
          />
        ) : (
          <div className="flex flex-row items-center justify-between gap-2 p-2 dark:bg-muted">
            <div className="flex flex-row items-center gap-2.5">
              <div className="size-3.5 animate-pulse rounded bg-muted-foreground/15" />
              <div className="h-3.5 w-24 animate-pulse rounded bg-muted-foreground/15" />
            </div>
            <div className="w-8" />
          </div>
        )}
        <div className="h-61.25 bg-muted p-6">
          <InlineDocumentSkeleton />
        </div>
      </div>
    );
  }

  const document: Document | null = previewDocument
    ? previewDocument
    : artifact.status === "streaming"
      ? {
          content: artifact.content,
          createdAt: new Date(),
          id: artifact.documentId,
          kind: artifact.kind,
          title: artifact.title,
          userId: "noop",
        }
      : null;

  if (!document) {
    return <LoadingSkeleton artifactKind={artifact.kind} />;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-61.25 rounded-3xl border border-border/50 overflow-hidden flex flex-col"
    >
      <DocumentHeader
        isStreaming={artifact.status === "streaming"}
        kind={document.kind}
        title={document.title}
        onFullScreen={handleFullScreen}
      />
      <DocumentContent document={document} />
    </div>
  );
}

const LoadingSkeleton = ({ artifactKind }: { artifactKind: ArtifactKind }) => (
  <div className="w-full max-w-112.5 rounded-3xl border border-border/50 overflow-hidden flex flex-col h-61.25">
    <div className="flex flex-row items-center justify-between gap-2 p-2 dark:bg-muted">
      <div className="flex flex-row items-center gap-2.5">
        <div className="size-3.5 animate-pulse rounded bg-muted-foreground/15" />
        <div className="h-3.5 w-24 animate-pulse rounded bg-muted-foreground/15" />
      </div>
      <div className="w-8" />
    </div>
    {artifactKind === "image" ? (
      <div className="flex-1 bg-muted">
        <div className="h-full w-full animate-pulse bg-muted-foreground/10" />
      </div>
    ) : (
      <div className="flex-1 bg-muted p-6">
        <InlineDocumentSkeleton />
      </div>
    )}
  </div>
);

const PureDocumentHeader = ({
  title,
  kind,
  isStreaming,
  onFullScreen,
}: {
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
  onFullScreen: () => void;
}) => (
  <div className="flex flex-row items-center justify-between gap-2 py-2 px-4 shrink-0">
    <div className="flex flex-row items-center gap-2.5">
      <div className="text-foreground">
        {isStreaming ? (
          <div className="animate-spin">
            <Loader size={14} />
          </div>
        ) : kind === "image" ? (
          <Image size={14} />
        ) : kind === "code" ? (
          <Code size={14} />
        ) : (
          <File size={14} />
        )}
      </div>
      <div className="text-sm font-medium">{title}</div>
    </div>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onFullScreen}>
          <Maximize />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        Open in full screen
      </TooltipContent>
    </Tooltip>
  </div>
);

const DocumentHeader = memo(PureDocumentHeader, (prevProps, nextProps) => {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  return true;
});

const DocumentHeaderSkeleton = ({
  title,
  kind,
  isStreaming,
}: {
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
}) => (
  <div className="flex flex-row items-center justify-between gap-2 p-2 dark:bg-muted shrink-0">
    <div className="flex flex-row items-center gap-2.5">
      <div className="text-foreground">
        {isStreaming ? (
          <div className="animate-spin">
            <Loader size={14} />
          </div>
        ) : kind === "image" ? (
          <Image size={14} />
        ) : kind === "code" ? (
          <Code size={14} />
        ) : (
          <File size={14} />
        )}
      </div>
      <div className="text-sm font-medium">{title}</div>
    </div>
    <div className="w-8" />
  </div>
);

const DocumentContent = ({ document }: { document: Document }) => {
  const { artifact } = useArtifact();

  const containerClassName = cn("flex-1 min-h-0", {
    "p-0": document.kind === "code",
    "p-4 sm:px-10 sm:py-10": document.kind === "text",
  });

  const commonProps = {
    content: document.content ?? "",
    currentVersionIndex: 0,
    isCurrentVersion: true,
    saveContent: () => null,
    status: artifact.status,
    suggestions: [],
    readOnly: true,
    isReadonly: true,
    className: "size-full",
  };

  const handleSaveContent = () => null;

  return (
    <div className={containerClassName}>
      {document.kind === "text" ? (
        <Editor {...commonProps} onSaveContent={handleSaveContent} />
      ) : document.kind === "code" ? (
        <div className="size-full">
          <CodeEditor {...commonProps} onSaveContent={handleSaveContent} />
        </div>
      ) : document.kind === "sheet" ? (
        <div className="size-full">
          <SpreadsheetEditor {...commonProps} />
        </div>
      ) : document.kind === "image" ? (
        <ImageEditor
          content={document.content ?? ""}
          currentVersionIndex={0}
          isCurrentVersion={true}
          isInline={true}
          status={artifact.status}
          title={document.title}
        />
      ) : null}
    </div>
  );
};
