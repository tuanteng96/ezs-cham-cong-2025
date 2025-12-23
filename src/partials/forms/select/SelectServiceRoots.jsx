import { useStore } from "framework7-react";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";
import ProdsAPI from "@/api/Prods.api";

function SelectServiceRoots(props) {
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  
  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectServicesRoots", key],
    queryFn: async () => {
      const { data } = await ProdsAPI.getServicesRoots({
        Key: key,
        Token: Auth?.token || "",
        isRootPublic: Brand?.Global?.Admin?.dat_lich_hien_dv_an ? -1 : ""
      });
      return data?.lst && data?.lst.length > 0
        ? data?.lst.map((item) => ({
            ...item,
            label: item?.IsRootPublic ? item.Title : `${item.Title} (Ẩn)`,
            value: item.ID,
            className: !item?.IsRootPublic ? "!text-danger" : ""
          }))
        : [];
    },
    keepPreviousData: true,
  });
  
  return (
    <SelectPicker
      options={data || []}
      {...props}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectServiceRoots;
