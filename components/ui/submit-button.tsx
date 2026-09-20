"use client";

import { useFormStatus } from "react-dom";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function SubmitButton({ children, pendingText, className, disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className={cn(className)} {...props}>
      {pending ? (
        <>
          <Loader2Icon className="animate-spin" />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
