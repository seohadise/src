"use client";

export const columns = [
  {
    accessorKey: "deposit",
    header: "نوع تراکنش",
    cell: ({ row }) => {
      return row.original.type === "deposit" ? "پرداخت" : "درخواست تسویه";
    },
  },
  {
    accessorKey: "amount",
    header: "مقدار تراکنش",
    cell: ({ row }) => row.original.amount.toLocaleString("fa-IR") + " تومان",
  },
  {
    accessorKey: "user.fullName",
    header: "نام کاربر",
  },
  {
    accessorKey: "user.number",
    header: "شماره تماس کاربر",
  },
];
