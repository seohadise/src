"use client";

import { useState, forwardRef } from "react";
import { Input } from "./input";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = forwardRef(({ ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
