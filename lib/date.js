// Safe import for server-side rendering
let dateLib = null;

const getDateLibSafe = () => {
  if (dateLib) return dateLib;
  if (typeof window !== "undefined") {
    try {
      const { getDateLib } = require("react-day-picker/persian");
      dateLib = getDateLib();
    } catch (e) {
      console.error("Failed to load date library:", e);
    }
  }
  return dateLib;
};

export const formatDateInPersian = (mode = "single", date) => {
  const lib = getDateLibSafe();
  
  if (mode === "single") {
    if (!date) return "انتخاب تاریخ ";
    if (lib) {
      try {
        return lib.format(date, "yyyy-MM-dd");
      } catch (e) {
        return new Date(date).toLocaleDateString("fa-IR");
      }
    }
    return new Date(date).toLocaleDateString("fa-IR");
  } else {
    if (date && date.from && date.to) {
      if (lib) {
        try {
          return `${lib.format(date.to, "yyyy-MM-dd")} - ${lib.format(date.from, "yyyy-MM-dd")} `;
        } catch (e) {
          return `${new Date(date.to).toLocaleDateString("fa-IR")} - ${new Date(date.from).toLocaleDateString("fa-IR")} `;
        }
      }
      return `${new Date(date.to).toLocaleDateString("fa-IR")} - ${new Date(date.from).toLocaleDateString("fa-IR")} `;
    } else {
      return "انتخاب بازه زمانی ";
    }
  }
};
