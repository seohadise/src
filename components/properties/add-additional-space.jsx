"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const toEnglishDigits = (str) => {
  if (str === null || str === undefined) return str;
  return String(str)
    .replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x06F0)
    .replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x0660);
};

const toNumber = (val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const converted = toEnglishDigits(val);
  const num = Number(converted);
  return isNaN(num) ? undefined : num;
};
import { z } from "zod";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
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

import { Plus } from "lucide-react";

const additionalSpaceSchema = z.object({
  spaceName: z.string().min(1, "نام فضا الزامی است"),
  spaceType: z.enum([
    "living-room",
    "kitchen",
    "bathroom",
    "yard",
    "balcony",
    "terrace",
    "garage",
    "storage",
    "other"
  ], { required_error: "نوع فضا الزامی است" }),
  area: z.number().min(0, "متراژ نمی‌تواند منفی باشد").optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

const SPACE_TYPE_LABELS = {
  "living-room": "سالن پذیرایی",
  "kitchen": "آشپزخانه",
  "bathroom": "سرویس بهداشتی",
  "yard": "حیاط",
  "balcony": "بالکن",
  "terrace": "تراس",
  "garage": "گاراژ",
  "storage": "انبار",
  "other": "سایر"
};

const COMMON_AMENITIES = [
  "تلویزیون",
  "یخچال",
  "ماشین لباسشویی",
  "ماشین ظرفشویی",
  "مایکروویو",
  "کولر",
  "بخاری",
  "پنکه",
  "آینه",
  "کمد",
  "میز",
  "صندلی",
  "مبل",
  "تخت",
  "قفسه",
  "چراغ",
  "پرده",
  "فرش",
  "گلدان",
  "تابلو"
];

const AddAdditionalSpace = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const form = useForm({
    resolver: zodResolver(additionalSpaceSchema),
    defaultValues: {
      spaceName: "",
      spaceType: "",
      area: 0,
      description: "",
      amenities: [],
    },
  });

  const onSubmit = (data, e) => {
    // Prevent event from bubbling to parent form
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const spaceData = {
      ...data,
      amenities: selectedAmenities,
    };
    onAdd(spaceData);
    form.reset();
    setSelectedAmenities([]);
    setOpen(false);
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          افزودن فضای جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>افزودن فضای اضافی</DialogTitle>
          <DialogDescription>
            اطلاعات فضای جدید اقامتگاه را وارد کنید
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => {
            e.stopPropagation();
            form.handleSubmit(onSubmit)(e);
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="spaceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام فضا</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: سالن اصلی" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spaceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع فضا</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نوع فضا" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(SPACE_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>متراژ</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="متراژ به متر مربع"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(toNumber(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توضیحات</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="توضیحات اضافی در مورد این فضا..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>امکانات فضا</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto">
                {COMMON_AMENITIES.map((amenity) => (
                  <Button
                    key={amenity}
                    type="button"
                    variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAmenity(amenity)}
                    className="text-xs"
                  >
                    {amenity}
                  </Button>
                ))}
              </div>
              {selectedAmenities.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  انتخاب شده: {selectedAmenities.join("، ")}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                انصراف
              </Button>
              <Button type="submit">
                افزودن فضا
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAdditionalSpace;
