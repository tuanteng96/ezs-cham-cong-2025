import React, { useState } from "react";
import { useStore } from "framework7-react";
import { PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
import AssetsHelpers from "../../../helpers/AssetsHelpers";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import clsx from "clsx";

function UploadFile({
  value,
  onChange,
  onChecked,
  PathFrame,
  widthClass = "w-32",
  heightClass = "h-32",
  wrapClass = "flex items-end",
}) {
  const [isCreate, setIsCreate] = useState(false);
  const Auth = useStore("Auth");
  const Brand = useStore("Brand");

  const onCreateImage = () => {
    setIsCreate(true);
  };

  window.addEventListener(
    "message",
    function ({ data }) {
      let dataJson = JSON.parse(data);
      if (dataJson?.Image) {
        onChange("/upload/image/" + dataJson?.Image);
        setIsCreate(false);
      }
      if (dataJson?.isClose) {
        setIsCreate(false);
      }
    },
    false
  );
  
  return (
    <div className={clsx(wrapClass)}>
      <div
        className="relative w-full h-full"
        onClick={(e) => {
          onChecked();
        }}
      >
        <label
          className={clsx(
            "flex flex-col items-center justify-center border-[1px] border-[#d5d7da] border-dashed rounded cursor-pointer",
            widthClass,
            heightClass
          )}
        >
          {value && (
            <div className="w-full h-full">
              <img
                className="object-contain w-full h-full"
                src={AssetsHelpers.toAbsoluteUrl(value, "")}
                alt="Hình ảnh"
              />
            </div>
          )}
        </label>
        <div
          className="absolute bg-white shadow-xl rounded-full w-6 h-6 flex items-center justify-center text-gray-600 -top-[10px] -right-[10px] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onCreateImage();
          }}
        >
          <PencilIcon className="w-4" />
        </div>

        {/* {value && (
          <div
            className="absolute bg-white shadow-xl rounded-full w-6 h-6 flex items-center justify-center text-muted -top-[10px] -right-[10px] cursor-pointer"
            onClick={() => onChange("")}
          >
            <XMarkIcon className="w-5" />
          </div>
        )} */}
      </div>
      {/* {PathFrame && value && (
        <div
          className="pl-5 text-sm cursor-pointer text-primary"
          onClick={onCreateImage}
        >
          Chỉnh sửa ảnh
        </div>
      )} */}

      {isCreate &&
        createPortal(
          <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
            <motion.div
              className="absolute inset-0 bg-black/[.5] z-10"
              initial={{ opacity: 0, translateY: "100%" }}
              animate={{ opacity: 1, translateY: "0%" }}
              exit={{ opacity: 0, translateY: "100%" }}
              onClick={() => setIsCreate(false)}
            ></motion.div>
            <motion.div
              className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] h-[calc(100%-var(--ezs-safe-area-top)-var(--f7-navbar-height))]"
              initial={{ opacity: 0, translateY: "100%" }}
              animate={{ opacity: 1, translateY: "0%" }}
              exit={{ opacity: 0, translateY: "100%" }}
            >
              <div className="w-full h-full overflow-hidden bg-white rounded">
                {PathFrame && (
                  <iframe
                    id="Demo1"
                    className="w-full h-full"
                    src={`${Brand?.Domain}${PathFrame}?token=${Auth?.token}`}
                    title="Mẫu 1"
                    // onLoad={handleIfrmeLoad}
                    //scrolling="no"
                  ></iframe>
                )}
                {/* <LoadingComponentFull loading={loading} /> */}
              </div>
            </motion.div>
          </div>,
          document.getElementById("framework7-root")
        )}
    </div>
  );
}

export default UploadFile;
