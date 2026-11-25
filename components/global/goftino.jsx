"use client";

import { useEffect } from "react";

const GoftinoInfo = ({ number, name, type }) => {
  useEffect(() => {
    const handleGoftinoReady = () => {
      if (name && number && type) {
        window.Goftino.setUser({
          phone: number,
          name,
          about: type,
          forceUpdate: true,
        });
      }
    };

    window.addEventListener("goftino_ready", handleGoftinoReady);

    return () => {
      window.removeEventListener("goftino_ready", handleGoftinoReady);
    };
  }, [name, number, type]);

  return null;
};

export default GoftinoInfo;
