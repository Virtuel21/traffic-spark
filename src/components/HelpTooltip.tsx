import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  className?: string;
}

export function HelpTooltip({ content, className }: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            aria-label="Help"
            className={cn("inline-flex items-center align-middle cursor-help", className)}
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-xs leading-relaxed text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
