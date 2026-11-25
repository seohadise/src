"use client";

import Image from "next/image";
import dynamic from "next/dynamic";

const SelectLocation = dynamic(() => import("../global/location"), {
  ssr: false,
});

import Back from "../global/back";
import AddBedroom from "./add-bedroom";
import AddAdditionalSpace from "./add-additional-space";
import Uploader from "../global/uplodaer";
import Uploader360 from "../global/uploader-360";
import NationalIdUploader from "../global/national-id-uploader";
import MultipleSelector from "../ui/multiple-selector";
import UnifiedCalendarManager, { addAvailabilityRangeToCalendar } from "./unified-calendar-manager";
import CancellationPolicySelector from "./cancellation-policy-selector";

import { useEffect, useState } from "react";

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
};
import { useForm, useFieldArray } from "react-hook-form";
import { useLocations } from "@/hooks/use-locations";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema } from "@/schemas/property";

import { createProperty } from "@/app/dashboard/property-owners/properties/_actions";
import {
  DEFAULT_CANCELLATION_POLICY,
  getPolicyByKey,
} from "@/constants/cancellation-policies";

const buildCancellationRulesPayload = (policyKey) => {
  const policy = getPolicyByKey(policyKey);
  return {
    penalties: policy.penalties.map((penalty) => ({ ...penalty })),
  };
};

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { PersianDatePicker } from "../ui/persian-date-picker";

import { formatDateInPersian } from "@/lib/date";

import { getCoolingPersianName, getHeatingPersianName } from "@/lib/utils";

import {
  AMENITIES_OPTIONS,
  ENTERTAINMENT_OPTIONS,
  FACILITY_OPTIONS,
  KITCHEN_EQUIPMENT_OPTIONS,
} from "@/constants/property-options";

import { CalendarIcon } from "lucide-react";

import { toast } from "sonner";

const toEnglishDigits = (str) => {
  if (str === null || str === undefined) return str;
  return String(str)
    .replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x06F0)
    .replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x0660)
    .replace(/[\u066B\u066C\u060C\u061B]/g, "");
};

const toNumber = (val) => {
  if (val === "" || val === null || val === undefined) return 0;
  const converted = toEnglishDigits(val);
  const num = Number(converted);
  return isNaN(num) ? 0 : num;
};

const NewProperty = () => {
  const isDesktop = useIsDesktop();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    "تصاویر و مدارک",
    "اطلاعات اصلی و آدرس",
    "مشخصات اقامتگاه",
    "قیمت‌گذاری و تقویم",
    "امکانات و اتاق‌ها",
    "قوانین و ثبت نهایی",
  ];

  const form = useForm({
    resolver: zodResolver(propertySchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      address: {
        province: "",
        city: "",
        fullAddress: "",
        location: {
          lat: "",
          lng: "",
        },
      },
      postalCode: "",
      number: "",
      managerName: "",
      managerNumber: "",
      area: 10,
      description: "",
      rules: "",
      bedrooms: [],
      // فیلدهای موقت برای اضافه کردن اتاق خواب
      bedName: "",
      beds: {
        single: 0,
        double: 0,
        sofa: 0,
      },
      amenities: {
        curtain: false,
        tv: false,
        closet: false,
        heating: "gas-heater",
        cooling: "water-cooler",
      },
      yearBuilt: 1404,
      capacity: 1,
      maxCapacity: 1,
      availableDates: [],
      images: [],
      images360: [],
      nationalIdCard: "",
      ownershipDocument: "",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      type: "villa",
      floorType: "carpet",
      condition: "new",
      facilities: [],
      kitchenEquipment: [],
      entertainment: [],
      amenities: [],
      environment: "city-center",
      heating: "gas-heater",
      cooling: "water-cooler",
      parkingAmount: 0,
      floor: 0,
      document: "",
      pricing: {
        regularPrice: 0,
        weekendPrice: 0,
        wednesdayPrice: 0,
        thursdayPrice: 0,
        fridayPrice: 0,
        peakPrice: 0,
        extraGuestPrice: 0,
        extraGuestPeakPrice: 0,
        longStayDiscount: 0,
        discount: 0,
        deposit: 0,
      },
      ownerShipType: "private",
      additionalSpaces: [],
      cancellationPolicy: DEFAULT_CANCELLATION_POLICY,
      cancellationRules: buildCancellationRulesPayload(DEFAULT_CANCELLATION_POLICY),
      reservationRules: {
        minimumStay: 1,
        maximumStay: 30,
        advanceBooking: 365,
        instantBooking: false,
        guestRequirements: "",
      },
      propertyRules: {
        smokingAllowed: false,
        petsAllowed: false,
        partyAllowed: false,
        singleGuestAllowed: false,
        privacyDocumentRequired: false,
      },
      ownerRole: "owner",
      guestDocumentType: "id-card",
      calendarDisplayMonths: 1,
      instantBooking: {
        enabled: false,
        dates: [],
      },
      lastMinuteDiscount: {
        enabled: false,
        discountPercent: 0,
        dates: [],
      },
      calendarSettings: [],
      availabilityStartDate: "",
      availabilityEndDate: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bedrooms",
  });

  const {
    fields: additionalSpaceFields,
    append: appendAdditionalSpace,
    remove: removeAdditionalSpace
  } = useFieldArray({
    control: form.control,
    name: "additionalSpaces",
  });

  const { provinces, cities, setSelectedProvince } = useLocations();

  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    form.setValue("address.city", "");
  };

  const handleAddBedroom = (bedroom) => {
    append(bedroom);
  };

  const handleAddAdditionalSpace = (space) => {
    appendAdditionalSpace(space);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: createProperty,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => {
          location.href = "/dashboard/property-owners";
        }, 1500);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      const msg = error.message || "";
      if (msg.includes("Failed to find Server Action") || msg.includes("older or newer deployment")) {
        toast.error("نسخه سایت قدیمی است. لطفاً صفحه را رفرش کنید و دوباره تلاش کنید.");
        setTimeout(() => location.reload(), 2000);
      } else {
        toast.error(msg || "خطایی رخ داده است");
      }
    },
  });

  const isLastStep = currentStep === steps.length - 1;
  const stepStates = steps.map((_, index) => ({
    isCompleted: index < currentStep,
    isCurrent: index === currentStep,
    isLast: index === steps.length - 1,
    number: index + 1,
  }));

  const stepFields = [
    ["images", "images360", "nationalIdCard", "ownershipDocument", "document"],
    ["name", "address.province", "address.city", "address.fullAddress", "address.location.lat", "address.location.lng", "postalCode", "number", "managerName", "managerNumber"],
    ["area", "yearBuilt", "capacity", "maxCapacity", "checkInTime", "checkOutTime", "type", "description", "rules", "environment", "floorType", "condition", "heating", "cooling", "parkingAmount", "floor", "ownerShipType"],
    ["pricing.regularPrice", "pricing.wednesdayPrice", "pricing.thursdayPrice", "pricing.fridayPrice", "pricing.peakPrice", "pricing.extraGuestPrice", "pricing.extraGuestPeakPrice", "pricing.longStayDiscount", "pricing.discount", "pricing.deposit", "availabilityStartDate", "availabilityEndDate", "calendarSettings"],
    ["facilities", "kitchenEquipment", "entertainment", "amenities", "bedrooms", "additionalSpaces"],
    ["propertyRules", "ownerRole", "guestDocumentType", "calendarDisplayMonths", "cancellationPolicy", "reservationRules.minimumStay", "reservationRules.maximumStay"],
  ];

  const scrollToError = (fieldName, delay = 100) => {
    setTimeout(() => {
      let element = document.querySelector(`[data-field="${fieldName}"]`);
      if (!element) {
        element = document.querySelector(`[data-field^="${fieldName}."]`);
      }
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-red-500", "rounded-lg", "p-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-red-500", "rounded-lg", "p-2");
        }, 3000);
      }
    }, delay);
  };

  const handleNextStep = async () => {
    const isLastStep = currentStep === steps.length - 1;
    const fieldsToValidate = isLastStep ? stepFields.flat() : stepFields[currentStep];
    await form.trigger();
    const errors = form.control._formState.errors;

    const findErrorInField = (fieldError) => {
      if (!fieldError) return null;
      if (fieldError?.message) return fieldError;
      if (fieldError?.type && typeof fieldError?.message === "string") return fieldError;
      if (typeof fieldError === "object") {
        for (const key of Object.keys(fieldError)) {
          const nested = findErrorInField(fieldError[key]);
          if (nested) return nested;
        }
      }
      return null;
    };

    const stepErrors = [];
    for (const field of fieldsToValidate) {
      const fieldError = field.split(".").reduce((obj, key) => obj?.[key], errors);
      if (fieldError?.message) {
        stepErrors.push({ field, message: fieldError.message });
      } else if (Array.isArray(fieldError)) {
        for (const err of fieldError) {
          if (err?.message) {
            stepErrors.push({ field, message: err.message });
            break;
          }
        }
      } else {
        const nestedError = findErrorInField(fieldError);
        if (nestedError) {
          stepErrors.push({ field, message: nestedError.message });
        }
      }
    }

    if (stepErrors.length === 0) {
      if (isLastStep) {
        if (!acceptedTerms) {
          return;
        }
        const calendarValue = form.getValues("calendarSettings");
        if (!calendarValue || calendarValue.length === 0) {
          toast.error("حداقل یک روز باید در تقویم ثبت شود");
          const calStepIndex = stepFields.findIndex(step => step.includes("calendarSettings"));
          if (calStepIndex !== -1 && calStepIndex !== currentStep) {
            setCurrentStep(calStepIndex);
          }
          return;
        }
        form.handleSubmit(mutate)();
      } else {
        const allFields = stepFields.flat();
        for (const f of allFields) {
          if (!fieldsToValidate.includes(f)) {
            form.clearErrors(f);
          }
        }
        setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      if (isLastStep && stepErrors.length > 0) {
        const stepIndex = stepFields.findIndex(step => 
          step.includes(stepErrors[0].field)
        );
        if (stepIndex !== -1 && stepIndex !== currentStep) {
          setCurrentStep(stepIndex);
          scrollToError(stepErrors[0].field, 300);
          return;
        }
      }
      scrollToError(stepErrors[0].field, 100);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center gap-5 p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <Back />

      <h1 className="font-bold text-xl lg:text-3xl text-center">
        ایجاد ملک جدید
      </h1>

      <p className="font-bold text-xs text-center leading-loose px-2">
        لطفا در وارد کردن اطلاعات دقت نمایید ، زیرا بعد از اولین رزرو موفق این
        اطلاعات قابل ویرایش یا حذف نخواهند شد.
      </p>

      {/* Stepper */}
      <div className="w-full max-w-4xl px-2">
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {stepStates.map((s, index) => (
            <div key={index} className="flex items-center gap-1 flex-shrink-0">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                  s.isCurrent
                    ? "bg-primary text-primary-foreground"
                    : s.isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.isCompleted ? s.number : s.number}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  s.isCurrent ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {steps[index]}
              </span>
              {!s.isLast && (
                <div className={`w-4 h-0.5 ${s.isCompleted ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {currentStep === 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl px-2">
        {form.watch("images")?.map((image) => (
          <div
            key={image}
            className="relative aspect-square w-full h-[200px] md:h-[250px] overflow-hidden rounded-lg"
          >
            <Image
              src={image}
              alt="Property Image"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center hover:scale-105 transition-transform duration-300"
              priority
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                const currentImages = form.getValues("images");
                form.setValue(
                  "images",
                  currentImages.filter((img) => img !== image)
                );
              }}
              className="absolute top-2 right-2 w-fit"
            >
              حذف
            </Button>
          </div>
        ))}
      </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(mutate)}
          className="flex flex-col w-full max-w-4xl px-2 lg:w-1/2 lg:grid lg:grid-cols-2 lg:items-start lg:mx-auto lg:p-3 gap-3"
        >
          {currentStep === 0 && (<>
          <FormField
            name="images"
            control={form.control}
            render={() => (
              <FormItem>
                <FormLabel>تصاویر</FormLabel>
                <FormControl>
                  <Uploader
                    title="انتخاب تصاویر"
                    onUpload={(urls) => {
                      const current = form.getValues("images") || [];
                      form.setValue("images", [...current, ...urls]);
                    }}
                    multiple
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="images360"
            control={form.control}
            render={() => (
              <FormItem>
                <FormLabel>تصاویر 360 درجه</FormLabel>
                <FormControl>
                  <Uploader360
                    title="انتخاب تصاویر 360 درجه"
                    onUpload={(urls) => form.setValue("images360", urls)}
                    value={form.watch("images360")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="document"
            control={form.control}
            render={() => (
              <FormItem>
                <FormLabel>قبض آب یا برق</FormLabel>
                <FormControl>
                  <Uploader
                    title="انتخاب تصویر"
                    onUpload={(url) => form.setValue("document", url)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="nationalIdCard"
            control={form.control}
            render={() => (
              <FormItem>
                <FormLabel>کارت ملی و شناسایی صاحب ملک</FormLabel>
                <FormControl>
                  <NationalIdUploader
                    onUpload={(url) => form.setValue("nationalIdCard", url)}
                    value={form.watch("nationalIdCard")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="ownershipDocument"
            control={form.control}
            render={() => (
              <FormItem>
                <FormLabel>مدرک سند مالکیت اقامتگاه</FormLabel>
                <FormControl>
                  <NationalIdUploader
                    onUpload={(url) => form.setValue("ownershipDocument", url)}
                    value={form.watch("ownershipDocument")}
                    uploadButtonLabel="آپلود سند مالکیت"
                    uploadedBadgeText="سند مالکیت آپلود شده"
                    previewAlt="سند مالکیت"
                    tipsTitle="نکات مهم سند مالکیت:"
                    tips={[
                      "• تصویر سند باید واضح و شامل تمام صفحات مهم باشد",
                      "• اطلاعات مالک و آدرس باید خوانا باشد",
                      "• فرمت‌های مجاز: JPG, PNG, WebP",
                      "• حداکثر حجم: 5 مگابایت",
                    ]}
                    errorMessages={{
                      type: "فقط فایل‌های تصویری (JPG, PNG, WebP) مجاز هستند",
                      size: "حجم تصویر نباید بیشتر از 5 مگابایت باشد",
                      upload: "خطا در آپلود سند مالکیت.",
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </>)}

          {currentStep === 1 && (<>
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>نام ملک</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="address.province"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>استان</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleProvinceChange(value);
                  }}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا استان خود را انتخاب کنید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {provinces?.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="address.city"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>شهر</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={(value) => field.onChange(value)}
                  value={field.value || ""}
                  disabled={!cities}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا شهر خود را انتخاب کنید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities?.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="address.fullAddress"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>آدرس کامل</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="آدرس کامل ملک را وارد کنید..."
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="address.location.lat"
            control={form.control}
            render={() => (
              <FormItem className="lg:col-span-2">
                <FormLabel>موقعیت دقیق روی نقشه</FormLabel>
                <SelectLocation
                  onPosition={(pos) => {
                    form.setValue("address.location.lat", String(pos[0]), { shouldValidate: true });
                    form.setValue("address.location.lng", String(pos[1]));
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="postalCode"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>کدپستی ملک</FormLabel>
                <FormControl>
                  <Input {...field} type="text" inputMode="numeric" pattern="[0-9]*" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="number"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>شماره تماس ملک</FormLabel>
                <FormControl>
                  <Input {...field} type="text" inputMode="numeric" pattern="[0-9]*" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="managerName"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>نام مدیر ملک</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="managerNumber"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>شماره تلفن مدیر ملک</FormLabel>
                <FormControl>
                  <Input {...field} type="text" inputMode="numeric" pattern="[0-9]*" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </>)}

          {currentStep === 2 && (<>
          <FormField
            name="area"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>متراژ - متر</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(toNumber(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="yearBuilt"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>سال ساخت</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(toNumber(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="capacity"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>ظرفیت استاندارد اقامتگاه (نفر)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    min={1}
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(toNumber(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="maxCapacity"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>ظرفیت حداکثر اقامتگاه (نفر)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    min={1}
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(toNumber(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="checkInTime"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>ساعت ورود</FormLabel>
                <FormControl>
                  <Input placeholder="برای مثال 14:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="checkOutTime"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>ساعت خروج</FormLabel>
                <FormControl>
                  <Input placeholder="برای مثال 18:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="type"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع ملک</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا نوع ملک را انتخاب نمایید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="villa">ویلا</SelectItem>
                    <SelectItem value="apartment">آپارتمان</SelectItem>
                    <SelectItem value="garden">باغ</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="description"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>توضیحات ملک</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="بنویسید ..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="rules"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>قوانین ملک</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="برای مثال استعمال دخانیات ممنوع و ..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="environment"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>بافت محیطی ملک</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا بافت محیطی ملک را انتخاب نمایید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="city-center">مرکز شهر</SelectItem>
                    <SelectItem value="forest">جنگلی</SelectItem>
                    <SelectItem value="coastal">ساحلی</SelectItem>
                    <SelectItem value="desert">کویری</SelectItem>
                    <SelectItem value="historical">تاریخی</SelectItem>
                    <SelectItem value="rural">روستایی</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="floorType"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع کف</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا نوع کف را انتخاب نمایید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="carpet">فرش</SelectItem>
                    <SelectItem value="earthenware">سرامیک</SelectItem>
                    <SelectItem value="stone">سنگ</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="condition"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>وضعیت ملک</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا وضعیت ملک را انتخاب نمایید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="new">نوساز</SelectItem>
                    <SelectItem value="old">قدیمی</SelectItem>
                    <SelectItem value="renovated">بازسازی شده</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="heating"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>سیستم گرمایشی</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا سیستم گرمایشی ملک رو انتخاب کنید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="gas-heater">بخاری گازی</SelectItem>
                    <SelectItem value="electric-heater">بخاری برقی</SelectItem>
                    <SelectItem value="radiator">رادیاتور</SelectItem>
                    <SelectItem value="electric-fan">فن کویل</SelectItem>
                    <SelectItem value="fireplace">شومینه</SelectItem>
                    <SelectItem value="fan-coil">فن کویل</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            name="cooling"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>سیستم سرمایشی</FormLabel>
                <Select
                  dir="rtl"
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="لطفا سیستم سرمایشی ملک رو انتخاب کنید" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="water-cooler">کولر آبی</SelectItem>
                    <SelectItem value="gas-cooler">کولر گازی</SelectItem>
                    <SelectItem value="split-unit">اسپلیت</SelectItem>
                    <SelectItem value="ceiling-fan">پنکه سقفی</SelectItem>
                    <SelectItem value="regular-fan">پنکه معمولی</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            name="parkingAmount"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>تعداد پارکینگ ملک </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    value={field.value}
                    onChange={(e) => field.onChange(toNumber(e.target.value))}
                    placeholder="اگر ندارد 0 را قرار بدید"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="floor"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>طبقه ملک </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    value={field.value}
                    onChange={(e) => field.onChange(toNumber(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="ownerShipType"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2 space-y-3">
                <FormLabel>نوع اقامتگاه</FormLabel>
                <FormControl>
                  <RadioGroup
                    dir="rtl"
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 rtl:space-x-reverse">
                      <RadioGroupItem value="public" id="public" />
                      <label
                        htmlFor="public"
                        className="grid gap-1.5 leading-none"
                      >
                        <div className="font-medium">دربست</div>
                        <div className="text-xs text-muted-foreground">
                          این ویلا دربست است و تمام فضاهای آن به طور کامل در
                          اختیار مهمان قرار خواهد گرفت.
                        </div>
                      </label>
                    </div>
                    <div className="flex items-start gap-3 rtl:space-x-reverse">
                      <RadioGroupItem value="private" id="private" />
                      <label
                        htmlFor="private"
                        className="grid gap-1.5 leading-none"
                      >
                        <div className="font-medium">غیر دربست</div>
                        <div className="text-xs text-muted-foreground">
                          این ویلا غیر دربست است و بعضی از فضاهای اقامتگاه
                          (مانند حیاط، سرویس‌های بهداشتی، استخر و...) با میزبان
                          و یا مهمان‌های دیگر به اشتراک گذاشته می‌شود.
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </>)}

          {currentStep === 3 && (<>
          <FormField
            name="pricing.regularPrice"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>قیمت شنبه تا سه‌شنبه (شبانه)</FormLabel>
                <FormControl>
                  <div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        min={1000}
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => field.onChange(toNumber(e.target.value))}
                        placeholder="مثال: 2000000"
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">تومان</span>
                    </div>
                    {field?.value !== 0 && (
                      <p className="text-sm font-bold mt-2">
                        {Number(field.value).toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="pricing.wednesdayPrice"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>قیمت چهارشنبه‌ها (شبانه)</FormLabel>
                <FormControl>
                  <div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        min={0}
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => field.onChange(toNumber(e.target.value))}
                        placeholder="مثال: 40000"
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">تومان</span>
                    </div>
                    {field?.value !== 0 && (
                      <p className="text-sm font-bold mt-2">
                        {Number(field.value).toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="pricing.thursdayPrice"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>قیمت پنج‌شنبه‌ها (شبانه)</FormLabel>
                <FormControl>
                  <div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        min={0}
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => field.onChange(toNumber(e.target.value))}
                        placeholder="مثال: 500000"
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">تومان</span>
                    </div>
                    {field?.value !== 0 && (
                      <p className="text-sm font-bold mt-2">
                        {Number(field.value).toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="pricing.fridayPrice"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>قیمت جمعه‌ها (شبانه)</FormLabel>
                <FormControl>
                  <div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        min={0}
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => field.onChange(toNumber(e.target.value))}
                        placeholder="مثال: 600000"
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">تومان</span>
                    </div>
                    {field?.value !== 0 && (
                      <p className="text-sm font-bold mt-2">
                        {Number(field.value).toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="pricing.peakPrice"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>قیمت روزهای پیک (شبانه)</FormLabel>
                <FormControl>
                  <div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        min={1000}
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => field.onChange(toNumber(e.target.value))}
                        placeholder="مثال: 210000"
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">تومان</span>
                    </div>
                    {field?.value !== 0 && (
                      <p className="text-sm font-bold mt-2">
                        {Number(field.value).toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="pricing.extraGuestPrice"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>قیمت نفرات اضافه (شبانه)</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      min={0}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => field.onChange(toNumber(e.target.value))}
                      placeholder="برای مثال 100,000 تومان"
                    />
                    {field?.value !== 0 && (
                      <p className="text-sm font-bold mt-2">
                        {field.value.toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="pricing.extraGuestPeakPrice"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>قیمت نفرات اضافه پیک (شبانه)</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      min={0}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => field.onChange(toNumber(e.target.value))}
                      placeholder="برای مثال 150,000 تومان"
                    />
                    {field?.value !== 0 && (
                      <p className="text-sm font-bold mt-2">
                        {field.value.toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="pricing.longStayDiscount"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>تخفیف مدت رزرو (30+ روز - درصد)</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      max={80}
                      min={0}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => field.onChange(toNumber(e.target.value))}
                      placeholder="برای مثال 10 درصد"
                    />
                    {field?.value !== 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        تخفیف {field.value}٪ برای رزروهای 30 روز و بیشتر
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="pricing.discount"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>تخفیف (درصد)</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      max={80}
                      min={0}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => field.onChange(toNumber(e.target.value))}
                      placeholder="برای مثال 5 درصد"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="pricing.deposit"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>بیعانه (درصد)</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      min={10}
                      max={80}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => field.onChange(toNumber(e.target.value))}
                      placeholder="برای مثال 10 درصد"
                    />
                    {field?.value !== 0 && (
                      <p className="text-sm font-bold mt-2">
                        {field.value}٪ از قیمت عادی معادل :
                        {form.watch("pricing.regularPrice") > 0 && (
                          <span className="mt-1 mr-2">
                            {Math.round(
                              form.watch("pricing.regularPrice") * (field.value / 100)
                            ).toLocaleString("fa-IR")}{" "}
                            تومان
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* بازه زمانی موجود بودن ملک */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              name="availabilityStartDate"
              control={form.control}
              render={({ field }) => (
                <FormItem data-field="availabilityStartDate">
                  <FormLabel>تاریخ شروع موجود بودن ملک</FormLabel>
                  <FormControl>
                    <PersianDatePicker
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="انتخاب تاریخ شروع"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="availabilityEndDate"
              control={form.control}
              render={({ field }) => (
                <FormItem data-field="availabilityEndDate">
                  <FormLabel>تاریخ پایان موجود بودن ملک</FormLabel>
                  <FormControl>
                    <PersianDatePicker
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="انتخاب تاریخ پایان"
                      defaultMonth={form.watch("availabilityStartDate") || undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {form.watch("availabilityStartDate") && form.watch("availabilityEndDate") && (
            <div className="lg:col-span-2">
              <Button
                type="button"
                size="sm"
                onClick={() => addAvailabilityRangeToCalendar(
                  form.watch("calendarSettings") || [],
                  (val) => form.setValue("calendarSettings", val),
                  form.watch("availabilityStartDate"),
                  form.watch("availabilityEndDate")
                )}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CalendarIcon className="w-4 h-4 ml-1" />
                افزودن بازه موجودی به تقویم
              </Button>
            </div>
          )}

          {/* مدیریت تقویم یکپارچه */}
          <div className="lg:col-span-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800 leading-relaxed">
              <p className="font-bold mb-1">راهنمای تقویم:</p>
              <p>با انتخاب هر روز یا کشیدن بازه‌ای از تاریخ‌ها در تقویم، می‌توانید نوع آن روزها را تغییر دهید. برای مثال می‌توانید روزهای انتخاب‌شده را به روزهای پیک تبدیل کنید، قیمت اختصاصی تعیین کنید، حداقل شب اقامت را مشخص کنید، یا روزها را مسدود کنید.</p>
            </div>
            <FormField
              name="calendarSettings"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <UnifiedCalendarManager
                      value={field.value || []}
                      onChange={field.onChange}
                      pricing={form.watch("pricing")}
                      availabilityStartDate={form.watch("availabilityStartDate")}
                      availabilityEndDate={form.watch("availabilityEndDate")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          </>)}

          {currentStep === 4 && (<>
          <FormField
            name="facilities"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>امکانات ملک</FormLabel>
                <FormControl>
                  <MultipleSelector
                    {...field}
                    defaultOptions={FACILITY_OPTIONS}
                    placeholder="انتخاب امکانات ملک"
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        نتیجه ای یافت نشد.
                      </p>
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="kitchenEquipment"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>امکانات آشپزخانه</FormLabel>
                <FormControl>
                  <MultipleSelector
                    {...field}
                    defaultOptions={KITCHEN_EQUIPMENT_OPTIONS}
                    placeholder="انتخاب امکانات آشپزخانه"
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        نتیجه ای یافت نشد.
                      </p>
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="entertainment"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>امکانات سرگرمی</FormLabel>
                <FormControl>
                  <MultipleSelector
                    {...field}
                    defaultOptions={ENTERTAINMENT_OPTIONS}
                    placeholder="انتخاب امکانات سرگرمی"
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        نتیجه ای یافت نشد.
                      </p>
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="amenities"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>امکانات رفاهی</FormLabel>
                <FormControl>
                  <MultipleSelector
                    {...field}
                    defaultOptions={AMENITIES_OPTIONS}
                    placeholder="انتخاب امکانات رفاهی"
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        نتیجه ای یافت نشد.
                      </p>
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="bedrooms"
            control={form.control}
            render={() => (
              <FormItem className="lg:col-span-2">
                <FormLabel>اتاق خواب</FormLabel>
                <FormControl>
                  <div className="flex flex-col lg:flex-row gap-3">
                    <AddBedroom form={form} onAdd={handleAddBedroom} />

                    <div className="grid grid-cols-2 gap-2 flex-1">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="bg-muted p-3 rounded-xl shadow-sm space-y-2.5 h-fit w-fit relative"
                        >
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => remove(index)}
                          >
                            ×
                          </Button>
                          <p className="font-medium">{field.bedName}</p>
                          <div className="text-sm text-muted-foreground">
                            <p>تخت یک نفره: {field.beds.single}</p>
                            <p>تخت دو نفره: {field.beds.double}</p>
                            <p>مبل تختخواب شو: {field.beds.sofa}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              سیستم گرمایشی:{" "}
                              {getHeatingPersianName(field.amenities.heating)}
                            </p>
                            <p>
                              سیستم سرمایشی:{" "}
                              {getCoolingPersianName(field.amenities.cooling)}
                            </p>
                            <p className="mt-2">
                              امکانات:
                              {field.amenities.curtain && " پرده "},
                              {field.amenities.tv && " تلویزیون "},
                              {field.amenities.closet && " کمد "}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="additionalSpaces"
            control={form.control}
            render={() => (
              <FormItem className="lg:col-span-2">
                <FormLabel>فضاهای اضافی اقامتگاه</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <AddAdditionalSpace onAdd={handleAddAdditionalSpace} />

                    {additionalSpaceFields.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {additionalSpaceFields.map((space, index) => (
                          <div
                            key={space.id}
                            className="bg-muted p-4 rounded-lg space-y-2 relative"
                          >
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0"
                              onClick={() => removeAdditionalSpace(index)}
                            >
                              ×
                            </Button>
                            <h4 className="font-medium">{space.spaceName}</h4>
                            <p className="text-sm text-muted-foreground">
                              نوع: {space.spaceType}
                            </p>
                            {space.area && (
                              <p className="text-sm text-muted-foreground">
                                متراژ: {space.area} متر مربع
                              </p>
                            )}
                            {space.description && (
                              <p className="text-sm text-muted-foreground">
                                {space.description}
                              </p>
                            )}
                            {space.amenities && space.amenities.length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                امکانات: {space.amenities.join("، ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </>)}

          {currentStep === 5 && (<>
          {/* قوانین اقامتگاه */}
          <div className="lg:col-span-2 space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-bold">قوانین اقامتگاه</h3>
            <p className="text-sm text-muted-foreground">
              میهمانان باید قبل از ورود اقامتگاه شما با قوانین شما موافق باشند
            </p>
            
            <FormField
              name="propertyRules.smokingAllowed"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>استعمال دخانیات مجاز نیست</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              name="propertyRules.petsAllowed"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>امکان برگزاری جشن وجود ندارد</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              name="propertyRules.partyAllowed"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>ورود حیوانات خانگی مجاز نیست</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              name="propertyRules.singleGuestAllowed"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>اقامت به افراد مجرد داده نمی‌شود</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              name="propertyRules.privacyDocumentRequired"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>ارائه مدرک محرمیت برای زوجین لازم است</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {form.formState.errors.propertyRules?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.propertyRules.message}
              </p>
            )}
          </div>

          {/* نقش در اقامتگاه */}
          <div className="lg:col-span-2">
            <FormField
              name="ownerRole"
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg font-bold">نقش شما در این اقامتگاه چیست؟</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex flex-row-reverse items-center justify-end space-x-3 space-y-0 space-x-reverse">
                        <FormLabel className="font-normal cursor-pointer">
                          صاحب خانه هستم
                        </FormLabel>
                        <FormControl>
                          <RadioGroupItem value="owner" />
                        </FormControl>
                      </FormItem>
                      <FormItem className="flex flex-row-reverse items-center justify-end space-x-3 space-y-0 space-x-reverse">
                        <FormLabel className="font-normal cursor-pointer">
                          وکیل صاحب خانه هستم
                        </FormLabel>
                        <FormControl>
                          <RadioGroupItem value="lawyer" />
                        </FormControl>
                      </FormItem>
                      <FormItem className="flex flex-row-reverse items-center justify-end space-x-3 space-y-0 space-x-reverse">
                        <FormLabel className="font-normal cursor-pointer">
                          واسطه هستم
                        </FormLabel>
                        <FormControl>
                          <RadioGroupItem value="agent" />
                        </FormControl>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* مدارک پذیرش مهمان */}
          <div className="lg:col-span-2">
            <FormField
              name="guestDocumentType"
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg font-bold">مدارک پذیرش مهمان</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex flex-row-reverse items-center justify-end space-x-3 space-y-0 space-x-reverse">
                        <FormLabel className="font-normal cursor-pointer">
                          فقط کارت شناسایی (کارت ملی)
                        </FormLabel>
                        <FormControl>
                          <RadioGroupItem value="id-card" />
                        </FormControl>
                      </FormItem>
                      <FormItem className="flex flex-row-reverse items-center justify-end space-x-3 space-y-0 space-x-reverse">
                        <FormLabel className="font-normal cursor-pointer">
                          مدارک محرمیت (شناسنامه، عقد نامه)
                        </FormLabel>
                        <FormControl>
                          <RadioGroupItem value="marriage-certificate" />
                        </FormControl>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* آخرین روز نمایش تقویم */}
          <div className="lg:col-span-2">
            <FormField
              name="calendarDisplayMonths"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-bold">آخرین روز نمایش تقویم</FormLabel>
                  <p className="text-sm text-muted-foreground mb-2">
                    مشخص کنید تا چه تاریخی بازه زمانی قابل و قبول برای رزرو باز باشد
                  </p>
                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب بازه زمانی" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">یک ماه بعد</SelectItem>
                      <SelectItem value="2">دو ماه بعد</SelectItem>
                      <SelectItem value="3">سه ماه بعد</SelectItem>
                      <SelectItem value="6">شش ماه بعد</SelectItem>
                      <SelectItem value="12">یک سال بعد</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            name="cancellationPolicy"
            control={form.control}
            render={({ field }) => (
              <FormItem className="lg:col-span-2 space-y-4">
                <FormLabel className="text-lg font-bold">قوانین کنسلی</FormLabel>
                <CancellationPolicySelector
                  value={field.value}
                  onChange={(nextValue) => {
                    field.onChange(nextValue);
                    form.setValue(
                      "cancellationRules",
                      buildCancellationRulesPayload(nextValue)
                    );
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="reservationRules.minimumStay"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>حداقل اقامت (شب)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    min={1}
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(toNumber(e.target.value))}
                    placeholder="1"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="reservationRules.maximumStay"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>حداکثر اقامت (شب)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    min={1}
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(toNumber(e.target.value))}
                    placeholder="30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* پذیرش قوانین و مقررات */}
          <div className="lg:col-span-2 flex items-start space-x-3 space-x-reverse p-4 border rounded-lg bg-muted/30">
            <Checkbox
              id="acceptTerms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked)}
            />
            <label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
              <Link href="/dashboard/property-owners/rules" target="_blank" className="text-primary font-bold underline">
                قوانین و مقررات ثبت اقامتگاه
              </Link>
              {" "}را مطالعه کرده‌ام و با تمامی موارد آن موافقم.
            </label>
          </div>
          {!acceptedTerms && (
            <p className="lg:col-span-2 text-sm text-destructive">
              پذیرش قوانین و مقررات برای ثبت ملک الزامی است.
            </p>
          )}
          </>)}

          {/* Navigation Buttons */}
          <div className="lg:col-span-2 flex items-center justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="min-w-[120px]"
            >
              مرحله قبلی
            </Button>
            <span className="text-sm text-muted-foreground">
              مرحله {currentStep + 1} از {steps.length}
            </span>
            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="min-w-[120px]"
              >
                تایید و ادامه
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isPending}
                onClick={handleNextStep}
                className="min-w-[120px]"
                size="lg"
              >
                ثبت و ایجاد ملک
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewProperty;
