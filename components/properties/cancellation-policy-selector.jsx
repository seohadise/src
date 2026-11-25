"use client";

import { useMemo } from "react";

import { CANCELLATION_POLICIES, getPolicyByKey } from "@/constants/cancellation-policies";

import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const toneStyles = {
  green: {
    border: "border-green-300",
    badge: "bg-green-100 text-green-700",
    bg: "bg-green-50/40",
  },
  blue: {
    border: "border-blue-300",
    badge: "bg-blue-100 text-blue-700",
    bg: "bg-blue-50/40",
  },
  red: {
    border: "border-red-300",
    badge: "bg-red-100 text-red-700",
    bg: "bg-red-50/40",
  },
};

const CancellationPolicySelector = ({ value, onChange }) => {
  const policies = useMemo(() => Object.values(CANCELLATION_POLICIES), []);
  const selectedPolicy = getPolicyByKey(value);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-primary/40 p-4 text-sm leading-7">
        <div className="font-bold text-base">قوانین کنسلی اقامتگاه را مشخص کنید.</div>
        <p className="text-muted-foreground text-sm">
          مهمان تا ۳۰ دقیقه بعد از پرداخت می‌تواند بدون جریمه انصراف دهد. پس از آن، طبق سیاست انتخابی شما، بخشی از مبلغ به عنوان خسارت نزد میزبان باقی می‌ماند.
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid gap-4"
        dir="rtl"
      >
        {policies.map((policy) => {
          const isActive = selectedPolicy.key === policy.key;
          const tones = toneStyles[policy.tone] || toneStyles.green;

          return (
            <label
              key={policy.key}
              className={`rounded-2xl border p-4 transition-all cursor-pointer flex flex-col gap-4 ${
                isActive
                  ? `border-2 border-primary shadow-lg ${tones.bg}`
                  : "border-border hover:border-primary/60"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={policy.key} id={`policy-${policy.key}`} />
                    <div className="font-bold text-lg">{policy.title}</div>
                  </div>
                  <Badge className={`${tones.badge} text-xs font-medium px-3 py-1`}>
                    {policy.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-6">{policy.description}</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {policy.notes.map((note, idx) => (
                    <li key={`${policy.key}-note-${idx}`}>• {note}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border bg-white/60 dark:bg-background/40">
                <div className="grid grid-cols-3 text-xs font-medium text-center border-b">
                  <span className="p-3">بازه زمانی</span>
                  <span className="p-3 border-x">خسارت میزبان</span>
                  <span className="p-3">بازگشت به مهمان</span>
                </div>
                {policy.penalties.map((penalty, index) => (
                  <div
                    key={`${policy.key}-penalty-${index}`}
                    className="grid grid-cols-3 text-center text-sm border-b last:border-b-0"
                  >
                    <span className="p-3 text-muted-foreground">{penalty.label}</span>
                    <span className="p-3 font-bold text-red-500">
                      %{penalty.hostPenaltyPercent}
                    </span>
                    <span className="p-3 font-bold text-green-600">
                      %{penalty.guestRefundPercent}
                    </span>
                  </div>
                ))}
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default CancellationPolicySelector;
