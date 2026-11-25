import { z } from "zod";

export const commentSchema = z.object({
  name: z.string().min(1, "نام الزامیست"),
  text: z.string().min(3, "متن نظر باید حداقل ۳ کاراکتر باشد"),
  rating: z.number().min(1, "حداقل امتیاز ۱ است").max(5, "حداکثر امتیاز ۵ است"),
});
