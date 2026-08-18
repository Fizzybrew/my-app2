"use client";

import { PenSquareIcon, Trash2Icon } from "lucide-react";
import type { ReactNode } from "react";
import {
  PromptInputCommand,
  PromptInputCommandEmpty,
  PromptInputCommandGroup,
  PromptInputCommandItem,
  PromptInputCommandList,
} from "@/components/ai-elements/prompt-input";

export type SlashCommand = {
  name: string;
  description: string;
  icon: ReactNode;
  action: string;
  shortcut?: string;
};

export const slashCommands: SlashCommand[] = [
  {
    action: "new",
    description: "Start a new chat",
    icon: <PenSquareIcon />,
    name: "new",
  },
  {
    action: "clear",
    description: "Clear current chat",
    icon: <Trash2Icon />,
    name: "clear",
  },
];

type SlashCommandMenuProps = {
  query: string;
  onSelect: (command: SlashCommand) => void;
};

export function SlashCommandMenu({ query, onSelect }: SlashCommandMenuProps) {
  const filtered = slashCommands.filter((cmd) =>
    cmd.name.startsWith(query.toLowerCase()),
  );

  if (filtered.length === 0) {
    return null;
  }

  return (
    <PromptInputCommand>
      <PromptInputCommandList>
        <PromptInputCommandEmpty>No commands found.</PromptInputCommandEmpty>
        <PromptInputCommandGroup>
          {filtered.map((cmd) => (
            <PromptInputCommandItem
              key={cmd.name}
              onSelect={() => onSelect(cmd)}
              value={`${cmd.name} ${cmd.description}`}
            >
              {cmd.icon}
              <span>{cmd.name}</span>
              <span className="text-muted-foreground">{cmd.description}</span>
            </PromptInputCommandItem>
          ))}
        </PromptInputCommandGroup>
      </PromptInputCommandList>
    </PromptInputCommand>
  );
}
