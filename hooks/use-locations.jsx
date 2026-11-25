"use client";

import axios from "axios";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export const useLocations = (prefix = "") => {
  const [selectedProvince, setSelectedProvince] = useState("تهران");

  const { data: provinces, isLoading: isLoadingProvinces } = useQuery({
    queryFn: () =>
      axios
        .get("/api/locations/provinces")
        .then((res) => res.data),
    queryKey: ["provinces", prefix],
  });

  const { data: cities, isLoading: isLoadingCities } = useQuery({
    queryFn: () =>
      axios
        .get(`/api/locations/cities?province=${selectedProvince}`)
        .then((res) => res.data),
    queryKey: ["cities", prefix, selectedProvince],
    enabled: !!selectedProvince,
  });

  return {
    provinces,
    cities,
    loading: isLoadingProvinces || isLoadingCities,
    setSelectedProvince,
  };
};
