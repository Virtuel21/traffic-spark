import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  className?: string;
}

export function HelpTooltip({ content, className }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Help"
          className={cn("inline-flex items-center align-middle", className)}
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-xs leading-relaxed text-sm">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
