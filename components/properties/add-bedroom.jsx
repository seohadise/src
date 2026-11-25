"use client";

import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

const toEnglishDigits = (str) => {
  if (str === null || str === undefined) return str;
  return String(str)
    .replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x06F0)
    .replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x0660);
};

const toNumber = (val) => {
  if (val === "" || val === null || val === undefined) return 0;
  const converted = toEnglishDigits(val);
  const num = Number(converted);
  return isNaN(num) ? 0 : num;
};

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import { Input } from "../ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const AddBedroom = ({ form, onAdd }) => {
  const handleSubmit = (e) => {
    e.preventDefault();

    // بررسی validation فیلدهای الزامی
    const bedName = form.getValues("bedName");
    const heating = form.getValues("amenities.heating");
    const cooling = form.getValues("amenities.cooling");
    const singleBeds = form.getValues("beds.single") || 0;
    const doubleBeds = form.getValues("beds.double") || 0;
    const sofaBeds = form.getValues("beds.sofa") || 0;

    if (!bedName || bedName.trim() === "") {
      form.setError("bedName", { message: "نام اتاق خواب الزامیست" });
      return;
    }

    if (!heating) {
      form.setError("amenities.heating", { message: "انتخاب سیستم گرمایشی الزامیست" });
      return;
    }

    if (!cooling) {
      form.setError("amenities.cooling", { message: "انتخاب سیستم سرمایشی الزامیست" });
      return;
    }

    // بررسی اینکه حداقل یک تخت انتخاب شده باشد
    if (singleBeds + doubleBeds + sofaBeds === 0) {
      form.setError("beds.single", { message: "حداقل یک تخت باید انتخاب شود" });
      return;
    }

    const bedroom = {
      bedName: bedName.trim(),
      beds: {
        single: form.getValues("beds.single") || 0,
        double: form.getValues("beds.double") || 0,
        sofa: form.getValues("beds.sofa") || 0,
      },
      amenities: {
        curtain: form.getValues("amenities.curtain") || false,
        tv: form.getValues("amenities.tv") || false,
        closet: form.getValues("amenities.closet") || false,
        heating: heating,
        cooling: cooling,
      },
    };

    onAdd(bedroom);

    // پاک کردن فرم
    form.setValue("bedName", "");
    form.setValue("beds.single", 0);
    form.setValue("beds.double", 0);
    form.setValue("beds.sofa", 0);
    form.setValue("amenities.curtain", false);
    form.setValue("amenities.tv", false);
    form.setValue("amenities.closet", false);
    form.setValue("amenities.heating", "gas-heater");
    form.setValue("amenities.cooling", "water-cooler");

    // پاک کردن خطاها
    form.clearErrors("bedName");
    form.clearErrors("amenities.heating");
    form.clearErrors("amenities.cooling");
    form.clearErrors("beds.single");
    form.clearErrors("beds.double");
    form.clearErrors("beds.sofa");
  };

  return (
    <div className="space-y-4 border rounded-xl p-4 lg:w-1/2">
      <h3 className="font-semibold">افزودن اتاق جدید</h3>
      <div className="space-y-4">
        <FormField
          name="bedName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام اتاق</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FormField
            name="beds.single"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>تخت یک نفره</FormLabel>
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
            name="beds.double"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>تخت دو نفره</FormLabel>
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
            name="beds.sofa"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>مبل تختخواب شو</FormLabel>
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
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">امکانات اتاق</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <FormField
              name="amenities.curtain"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>پرده</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              name="amenities.tv"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>تلویزیون</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              name="amenities.closet"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>کمد</FormLabel>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              name="amenities.heating"
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
                        <SelectValue placeholder="لطفا انتخاب کنید" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gas-heater">بخاری گازی</SelectItem>
                      <SelectItem value="electric-heater">
                        بخاری برقی
                      </SelectItem>
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
              name="amenities.cooling"
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
                        <SelectValue placeholder="لطفا انتخاب کنید" />
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
          </div>
        </div>

        <Button type="button" onClick={handleSubmit}>
          افزودن اتاق
        </Button>
      </div>
    </div>
  );
};

export default AddBedroom;
